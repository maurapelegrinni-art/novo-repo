import type { Patient, Tutor } from '../store/useAppStore';

export interface PatientHit {
  patient: Patient;
  tutor: Tutor | undefined;
}

// Remove acentos (faixa de diacríticos combinantes U+0300–U+036F).
const DIACRITICS = /[̀-ͯ]/g;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');
const digits = (s: string) => s.replace(/\D/g, '');

/**
 * Busca inteligente por nome do paciente, nome/CPF/telefone/WhatsApp do
 * responsável ou número do prontuário. Retorna pacientes com o tutor.
 */
export function searchPatients(query: string, patients: Patient[], tutors: Tutor[]): PatientHit[] {
  const tutorById = new Map(tutors.map((t) => [t.id, t]));
  const hits = patients.map((p) => ({ patient: p, tutor: tutorById.get(p.tutorId) }));

  const q = norm(query).trim();
  const qDigits = digits(query);
  if (!q && !qDigits) return hits;

  return hits.filter(({ patient, tutor }) => {
    const textMatch =
      norm(patient.name).includes(q) ||
      norm(patient.prontuario).includes(q) ||
      (tutor ? norm(tutor.name).includes(q) : false);
    const digitMatch =
      qDigits.length > 0 &&
      ((tutor && digits(tutor.cpf).includes(qDigits)) ||
        (tutor && digits(tutor.phone).includes(qDigits)) ||
        (tutor && digits(tutor.whatsapp).includes(qDigits)) ||
        digits(patient.prontuario).includes(qDigits));
    return (q !== '' && textMatch) || Boolean(digitMatch);
  });
}
