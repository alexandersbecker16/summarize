export type SubjectId =
  | 'ap-lang'
  | 'multivar'
  | 'ap-bio'
  | 'chinese-iv'
  | 'ap-econ'
  | 'apush'

export interface Subject {
  id: SubjectId
  short: string
  name: string
  accent: string
  accentSoft: string
}

export const SUBJECTS: Subject[] = [
  {
    id: 'ap-lang',
    short: 'AP Lang',
    name: 'AP English Language',
    accent: '#c45c26',
    accentSoft: 'rgba(196, 92, 38, 0.12)',
  },
  {
    id: 'multivar',
    short: 'Multivar',
    name: 'Multivariable Calculus',
    accent: '#1a6b5c',
    accentSoft: 'rgba(26, 107, 92, 0.12)',
  },
  {
    id: 'ap-bio',
    short: 'AP Bio',
    name: 'AP Biology',
    accent: '#2d6a4f',
    accentSoft: 'rgba(45, 106, 79, 0.12)',
  },
  {
    id: 'chinese-iv',
    short: 'Chinese IV',
    name: 'Chinese IV',
    accent: '#9b2226',
    accentSoft: 'rgba(155, 34, 38, 0.12)',
  },
  {
    id: 'ap-econ',
    short: 'AP Econ',
    name: 'AP Econ (Micro / Macro)',
    accent: '#1d4e89',
    accentSoft: 'rgba(29, 78, 137, 0.12)',
  },
  {
    id: 'apush',
    short: 'APUSH',
    name: 'AP U.S. History',
    accent: '#5c4d7a',
    accentSoft: 'rgba(92, 77, 122, 0.12)',
  },
]

export function getSubject(id: SubjectId): Subject {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0]
}
