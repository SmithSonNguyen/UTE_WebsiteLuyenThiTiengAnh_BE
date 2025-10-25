export interface SaveAttendanceReqBody {
  classId: string
  sessionDate: string // ISO date string
  sessionNumber: number
  topic?: string
  instructorId: string
  records: {
    studentId: string
    isPresent: boolean
    note?: string
  }[]
  status?: 'draft' | 'finalized'
}

export interface GetAttendanceReqQuery {
  classId: string
  date: string // ISO date string
}

export interface GetAttendanceHistoryReqQuery {
  classId: string
  fromDate?: string
  toDate?: string
  limit?: string
  page?: string
}

export interface GetStudentAttendanceReqQuery {
  studentId: string
  classId: string
}

export interface FinalizeAttendanceReqBody {
  attendanceId: string
}
