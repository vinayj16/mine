import type { GuardianApi } from '../../services/guardianService';

type GuardianChildRecord = NonNullable<GuardianApi['children']>[number];
type GuardianChildStudent = GuardianChildRecord['studentId'];

export interface GuardianChildDisplay {
  name: string;
  classLabel: string;
  section: string;
  avatar: string;
}

export interface GuardianDisplay {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  addedOn: string;
  status: GuardianApi['status'];
  child: GuardianChildDisplay;
}

const DEFAULT_GUARDIAN_AVATAR = '/assets/img/parents/parent-default.jpg';
const DEFAULT_STUDENT_AVATAR = '/assets/img/students/student-default.jpg';

function formatDate(value?: string): string {
  if (!value) return 'Unknown';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

function resolveClassLabel(childStudent?: GuardianChildStudent): string {
  if (!childStudent) return '—';
  const classId = childStudent.classId;
  if (!classId) return '—';
  if (typeof classId === 'string') {
    return classId;
  }
  return classId.name ?? classId._id ?? '—';
}

function resolveChildAvatar(childStudent?: GuardianChildStudent): string {
  if (!childStudent) return DEFAULT_STUDENT_AVATAR;
  return childStudent.avatar ?? DEFAULT_STUDENT_AVATAR;
}

function resolveChildName(childStudent?: GuardianChildStudent): string {
  if (!childStudent) return 'Not assigned';
  const first = childStudent.firstName ?? '';
  const last = childStudent.lastName ?? '';
  if (first || last) {
    return `${first} ${last}`.trim();
  }

  if (childStudent.studentId) {
    return childStudent.studentId;
  }

  return 'Unknown student';
}

export const mapGuardianToDisplay = (guardian: GuardianApi): GuardianDisplay => {
  const activeChild =
    guardian.children?.find((child) => child.isActive) ?? guardian.children?.[0];

  const childStudent = activeChild?.studentId;

  return {
    id: guardian.guardianId,
    name: `${guardian.firstName} ${guardian.lastName}`.trim(),
    email: guardian.email,
    phone: guardian.phone,
    avatar: guardian.avatar ?? DEFAULT_GUARDIAN_AVATAR,
    addedOn: formatDate(guardian.createdAt),
    status: guardian.status,
    child: {
      name: resolveChildName(childStudent),
      classLabel: resolveClassLabel(childStudent),
      section: childStudent?.section ?? '—',
      avatar: resolveChildAvatar(childStudent)
    }
  };
};
