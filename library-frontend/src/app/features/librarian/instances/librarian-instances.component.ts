import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BookInstanceService } from '../../../core/services/book-instance.service';
import { BookInstanceDto } from '../../../core/models/book-instance.model';
import { PublicationService } from '../../../core/services/publication.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { LibrarianUsersService } from '../../../core/services/librarian-users.service';
import { LibrarianLoansService } from '../../../core/services/librarian-loans.service';
type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: BookInstanceDto[] };

@Component({
  selector: 'app-librarian-instances',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './librarian-instances.component.html',
})
export class LibrarianInstancesComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private service = inject(BookInstanceService);
  private publicationService=inject(PublicationService);
  private userService=inject(LibrarianUsersService);
  private loanService=inject(LibrarianLoansService);
  publicationID!: number;

  selectedInstance = signal<any | null>(null);
  showStatusModal = signal(false);
  statusLoading = signal(false);
  showLoanModal = signal(false);
  loanLoading = signal(false);
  showAddModal=signal(false);
  addLoading=signal(false);
  addError=signal('');
  userQuery = signal('');
  userOptions = signal<any[]>([]);
  userLoading = signal(false);
  userDropdownOpen = signal(false);
  selectedUser = signal<any | null>(null);

  private fb=inject(FormBuilder);


  state = signal<UiState>({ status: 'loading' });
  publication=signal<any | null>(null);
  isLoading = computed(() => this.state().status === 'loading');
  isError = computed(() => this.state().status === 'error');


  instances = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.data : [];
  });

  addForm=this.fb.nonNullable.group({
    location:['',Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('publicationID');

    if (!id) {
      this.state.set({
        status: 'error',
        message: 'Ne postoji publicationId u ruti.',
      });
      return;
    }

    this.publicationID = Number(id);
    this.loadPublication();
    this.fetch();
  }

  fetch(): void {
    this.state.set({ status: 'loading' });

    this.service.getByPublication(this.publicationID).subscribe({
      next: (res: any) => {
        this.state.set({
          status: 'ready',
          data: res.content ?? [],
        });
      },
      error: () => {
        this.state.set({
          status: 'error',
          message: 'Greška pri učitavanju primjeraka.',
        });
      },
    });
  }

  loadPublication() {
  this.publicationService.getById(this.publicationID).subscribe({
    next: (p) => this.publication.set(p),
  });
}

  changeStatus(id: number, status: string): void {
    this.service.updateStatus(id, status).subscribe({
      next: () => this.fetch(),
      error: (err) => alert(err?.error?.message || 'Greška'),
    });
  }

  openStatusModal(instance: any) {
  this.selectedInstance.set(instance);
  this.showStatusModal.set(true);
}

closeStatusModal() {
  if (this.statusLoading()) return;
  this.showStatusModal.set(false);
}

confirmStatusChange(status: string) {
  const instance = this.selectedInstance();
  if (!instance) return;

  this.statusLoading.set(true);

  this.service.updateStatus(instance.instanceID, status).subscribe({
    next: () => {
      this.statusLoading.set(false);
      this.showStatusModal.set(false);
      this.fetch();
    },
    error: (err) => {
      this.statusLoading.set(false);
      alert(err?.error?.message || 'Greška');
    },
  });
}

openAdd() {
  this.addError.set('');

  this.addForm.reset({
    location: '',
  });

  this.showAddModal.set(true);
}

closeAdd() {
  if (this.addLoading()) return;
  this.showAddModal.set(false);
}

submitAdd() {
  if (this.addForm.invalid) {
    this.addForm.markAllAsTouched();
    return;
  }

  const payload = {
    ...this.addForm.getRawValue(),
    publicationId: this.publicationID,
  };

  this.addLoading.set(true);

  this.service.create(payload).subscribe({
    next: () => {
      this.addLoading.set(false);
      this.showAddModal.set(false);
      this.fetch(); // refresh tabela
    },
    error: (err) => {
      this.addLoading.set(false);
      this.addError.set(err?.error?.message || 'Greška pri dodavanju.');
    },
  });
}

openLoanModal(instance: BookInstanceDto) {
  this.selectedInstance.set(instance);
  this.showLoanModal.set(true);
}

closeLoanModal() {
  if (this.loanLoading()) return;
  this.showLoanModal.set(false);
}

submitLoan() {
  const instance = this.selectedInstance();
  const user = this.selectedUser();

  if (!instance || !user) return;

  this.loanLoading.set(true);

  const payload = {
  userId: user.userID,
  instanceId: instance.instanceID, // 🔥 OVO!
};

  this.loanService.createLoan(payload).subscribe({
    next: () => {
      this.loanLoading.set(false);
      this.showLoanModal.set(false);
      this.fetch(); // refresh instances

      alert('Uspješno iznajmljeno!');
    },
    error: (err) => {
      this.loanLoading.set(false);
      alert(err?.error?.message || 'Greška');
    },
  });
}

private userDebounce: any;

onUserQueryChange(value: string) {
  this.userQuery.set(value);
  this.selectedUser.set(null);

  clearTimeout(this.userDebounce);

  const q = value.trim();

  if (q.length < 2) {
    this.userOptions.set([]);
    this.userDropdownOpen.set(false);
    return;
  }

  this.userDropdownOpen.set(true);

  this.userDebounce = setTimeout(() => {
    this.fetchUsers(q);
  }, 300);
}

selectUser(u: any) {
  this.selectedUser.set(u);
  this.userQuery.set(`${u.membershipNumber} — ${u.name}`);
  this.userOptions.set([]);
  this.userDropdownOpen.set(false);
}

fetchUsers(q: string) {
  this.userLoading.set(true);

  this.userService.searchByMembership(q, 0, 8).subscribe({
    next: (res: any) => {
      this.userOptions.set(res.content ?? []);
      this.userLoading.set(false);
    },
    error: () => {
      this.userOptions.set([]);
      this.userLoading.set(false);
    },
  });
}
}