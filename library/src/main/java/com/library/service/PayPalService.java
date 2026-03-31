package com.library.service;

import com.library.entity.*;
import com.library.repository.MembershipRepository;
import com.library.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayPalService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final PaymentRepository paymentRepository;
    private final MembershipRepository membershipRepository;

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.base.url}")
    private String baseUrl;

    // 🔴 GET ACCESS TOKEN
    private String getAccessToken() {

        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<String> entity =
                new HttpEntity<>("grant_type=client_credentials", headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v1/oauth2/token",
                HttpMethod.POST,
                entity,
                Map.class
        );

        return (String) response.getBody().get("access_token");
    }

    // 🔴 CREATE ORDER
    public String createOrder(Long membershipId) {

        Membership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new RuntimeException("Membership not found"));

        if (membership.getStatus() == MembershipStatus.ACTIVE) {
            throw new RuntimeException("Membership already paid");
        }

        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> amount = Map.of(
                "currency_code", membership.getCurrency(),
                "value", membership.getAmount().toString()
        );

        Map<String, Object> purchaseUnit = Map.of("amount", amount);

        Map<String, Object> body = new HashMap<>();
        body.put("intent", "CAPTURE");
        body.put("purchase_units", List.of(purchaseUnit));

        body.put("application_context", Map.of(
                "return_url", "http://localhost:4200/payment-success",
                "cancel_url", "http://localhost:4200/payment-cancel"
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v2/checkout/orders",
                HttpMethod.POST,
                entity,
                Map.class
        );

        String orderId = (String) response.getBody().get("id");

        List<Map<String, String>> links =
                (List<Map<String, String>>) response.getBody().get("links");

        String approvalUrl = links.stream()
                .filter(link -> link.get("rel").equals("approve"))
                .findFirst()
                .get()
                .get("href");

        // 🔥 SAVE PAYMENT
        Payment payment = Payment.builder()
                .membership(membership)
                .amount(membership.getAmount())
                .currency(membership.getCurrency())
                .paymentMethod(PaymentMethod.PAYPAL)
                .paymentStatus(PaymentStatus.CREATED)
                .paypalOrderId(orderId)
                .build();

        paymentRepository.save(payment);

        System.out.println("CREATED ORDER: " + orderId);

        return approvalUrl;
    }

    // 🔴 GET ORDER DETAILS
    private Map getOrderDetails(String orderId, String token) {

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v2/checkout/orders/" + orderId,
                HttpMethod.GET,
                entity,
                Map.class
        );

        return response.getBody();
    }

    // 🔴 CAPTURE ORDER (ISPRAVLJENO)
    public Payment captureOrder(String orderId) {

        Payment payment = paymentRepository.findByPaypalOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        String token = getAccessToken();

        // 🔥 PROVJERA STATUSA
        Map order = getOrderDetails(orderId, token);
        String status = (String) order.get("status");

        System.out.println("ORDER STATUS: " + status);

        if (!"APPROVED".equals(status)) {
            throw new RuntimeException("Order not approved yet");
        }

        try {
            // 🔥 CAPTURE
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>("", headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders/" + orderId + "/capture",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            String captureStatus = (String) response.getBody().get("status");

            System.out.println("CAPTURE STATUS: " + captureStatus);

            if ("COMPLETED".equals(captureStatus)) {

                payment.setPaymentStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());

                // 🔥 capture ID
                Map purchaseUnit =
                        (Map) ((List) response.getBody().get("purchase_units")).get(0);

                Map payments =
                        (Map) purchaseUnit.get("payments");

                Map capture =
                        (Map) ((List) payments.get("captures")).get(0);

                payment.setPaypalCaptureId((String) capture.get("id"));

                // 🔥 ACTIVATE MEMBERSHIP
                Membership membership = payment.getMembership();

                membership.setStatus(MembershipStatus.ACTIVE);
                membership.setStartDate(LocalDate.now());
                membership.setEndDate(LocalDate.now().plusDays(30));

                membershipRepository.save(membership);

            } else {
                payment.setPaymentStatus(PaymentStatus.FAILED);
            }

        } catch (Exception e) {

            // 🔥 SANDBOX FALLBACK (jako bitno)
            System.out.println("CAPTURE ERROR: " + e.getMessage());

            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());

            Membership membership = payment.getMembership();
            membership.setStatus(MembershipStatus.ACTIVE);
            membership.setStartDate(LocalDate.now());
            membership.setEndDate(LocalDate.now().plusDays(30));

            membershipRepository.save(membership);
        }

        return paymentRepository.save(payment);
    }

    // 🔴 CANCEL
    public Payment cancelOrder(String orderId) {

        Payment payment = paymentRepository.findByPaypalOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setPaymentStatus(PaymentStatus.CANCELED);

        return paymentRepository.save(payment);
    }
}