import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'absentees', label: 'Absentees' },
  { id: 'hourly', label: 'Hourly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'date-wise', label: 'Date Wise' },
];

const CSV_EXPORT_ALLOWED_TABS = new Set(['hourly', 'monthly', 'date-wise']);

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const DEFAULT_DAILY_SLOTS = [
  { hourLabel: 'Hour 1', slot: '9:30 AM - 10:30 AM' },
  { hourLabel: 'Hour 2', slot: '10:30 AM - 11:20 AM' },
  { hourLabel: 'Hour 3', slot: '11:30 AM - 12:30 PM' },
  { hourLabel: 'Hour 4', slot: '1:30 PM - 2:30 PM' },
  { hourLabel: 'Hour 5', slot: '2:30 PM - 3:30 PM' },
];

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-yellow-100 text-yellow-800',
  absent: 'bg-red-100 text-red-800',
  'not-marked': 'bg-gray-100 text-gray-700',
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToday = () => toInputDate(new Date());
const normalizeBatch = (value = '') => value.toUpperCase().trim();

const dateOnly = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const normalizeSlotLabel = (slot = '') => slot.replace(/\s+/g, ' ').trim().toLowerCase();

const parseSlotStartMinutes = (slot = '') => {
  const firstPart = slot.split('-')[0]?.trim();
  if (!firstPart) return Number.MAX_SAFE_INTEGER;

  const numeric = Number(firstPart);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return numeric * 60;
  }

  const parsed = new Date(`1970-01-01 ${firstPart}`);
  if (Number.isNaN(parsed.getTime())) return Number.MAX_SAFE_INTEGER;
  return parsed.getHours() * 60 + parsed.getMinutes();
};

const sortSlots = (slots = []) =>
  [...slots].sort((a, b) => {
    const aStart = parseSlotStartMinutes(a);
    const bStart = parseSlotStartMinutes(b);
    if (aStart === bStart) return a.localeCompare(b, undefined, { numeric: true });
    return aStart - bStart;
  });

const toCsvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildCsvContent = (rows) => rows.map((row) => row.map(toCsvCell).join(',')).join('\n');

const sanitizeFilePart = (value = '') => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'report';
};

const downloadCsvFile = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AttendanceReport = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');

  const [dailyDate, setDailyDate] = useState(getToday());
  const [selectedDailySlot, setSelectedDailySlot] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState('all');

  const [absenteesDate, setAbsenteesDate] = useState(getToday());

  const [hourlyYear, setHourlyYear] = useState(currentYear);
  const [hourlyMonth, setHourlyMonth] = useState(currentMonth);

  const [monthlyYear, setMonthlyYear] = useState(currentYear);
  const [monthlyMonth, setMonthlyMonth] = useState(currentMonth);

  const [rangeStartDate, setRangeStartDate] = useState(
    toInputDate(new Date(currentYear, currentMonth, 1))
  );
  const [rangeEndDate, setRangeEndDate] = useState(getToday());

  useEffect(() => {
    const loadData = async () => {
      if (!user?.department) return;

      try {
        setLoading(true);
        const [batchesRes, studentsRes, attendanceRes] = await Promise.all([
          api.batches.list({ department: user.department }),
          api.users.byRole('student'),
          api.attendance.list({ role: 'student' }),
        ]);

        setBatches(batchesRes.data || []);
        setStudents(studentsRes.users || []);
        setAttendance(attendanceRes.attendance || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load attendance report data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.department]);

  const batchOptions = useMemo(() => {
    const set = new Set();

    batches.forEach((batch) => {
      const code = normalizeBatch(batch.batchCode);
      if (code) set.add(code);
    });

    students.forEach((student) => {
      const code = normalizeBatch(student.batch);
      if (code) set.add(code);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [batches, students]);

  useEffect(() => {
    if (!selectedBatch && batchOptions.length > 0) {
      setSelectedBatch(batchOptions[0]);
    }
  }, [selectedBatch, batchOptions]);

  const studentsInBatch = useMemo(() => {
    return students
      .filter((student) => normalizeBatch(student.batch) === selectedBatch)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, selectedBatch]);

  const studentIdSet = useMemo(() => {
    return new Set(studentsInBatch.map((student) => student.id));
  }, [studentsInBatch]);

  const batchAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const userId = record?.userId?._id || record?.userId;
      return userId && studentIdSet.has(userId.toString());
    });
  }, [attendance, studentIdSet]);

  const dailyAttendance = useMemo(() => {
    return batchAttendance.filter((record) => dateOnly(record.date) === dailyDate);
  }, [batchAttendance, dailyDate]);

  const dailySlots = useMemo(() => {
    const uniqueSlots = new Set(dailyAttendance.map((record) => record.timeSlot).filter(Boolean));
    return sortSlots(Array.from(uniqueSlots));
  }, [dailyAttendance]);

  const dailySlotSummary = useMemo(() => {
    const slotRecordsByKey = new Map();

    dailyAttendance.forEach((record) => {
      const rawSlot = (record.timeSlot || '').trim();
      const key = normalizeSlotLabel(rawSlot);
      if (!key) return;
      if (!slotRecordsByKey.has(key)) {
        slotRecordsByKey.set(key, { slot: rawSlot, records: [] });
      }
      slotRecordsByKey.get(key).records.push(record);
    });

    const defaultSlotKeys = new Set(DEFAULT_DAILY_SLOTS.map((slotConfig) => normalizeSlotLabel(slotConfig.slot)));

    const defaultSummary = DEFAULT_DAILY_SLOTS.map((slotConfig) => {
      const key = normalizeSlotLabel(slotConfig.slot);
      const slotData = slotRecordsByKey.get(key);
      const slotRecords = slotData?.records || [];
      const presentCount = slotRecords.filter((record) => record.status === 'present').length;
      const lateCount = slotRecords.filter((record) => record.status === 'late').length;
      const absentCount = slotRecords.filter((record) => record.status === 'absent').length;

      return {
        hourLabel: slotConfig.hourLabel,
        slot: slotData?.slot || slotConfig.slot,
        presentCount,
        lateCount,
        absentCount,
      };
    });

    const extraSlots = sortSlots(
      Array.from(slotRecordsByKey.values())
        .map((slotData) => slotData.slot)
        .filter((slot) => !defaultSlotKeys.has(normalizeSlotLabel(slot)))
    );

    const extraSummary = extraSlots.map((slot, index) => {
      const slotRecords = slotRecordsByKey.get(normalizeSlotLabel(slot))?.records || [];
      const presentCount = slotRecords.filter((record) => record.status === 'present').length;
      const lateCount = slotRecords.filter((record) => record.status === 'late').length;
      const absentCount = slotRecords.filter((record) => record.status === 'absent').length;

      return {
        hourLabel: `Hour ${DEFAULT_DAILY_SLOTS.length + index + 1}`,
        slot,
        presentCount,
        lateCount,
        absentCount,
      };
    });

    return [...defaultSummary, ...extraSummary];
  }, [dailyAttendance]);

  const selectableDailySlots = useMemo(() => {
    return dailySlotSummary.map((slotCard) => slotCard.slot);
  }, [dailySlotSummary]);

  useEffect(() => {
    if (!selectedDailySlot && selectableDailySlots.length > 0) {
      setSelectedDailySlot(selectableDailySlots[0]);
      return;
    }

    const selectedKey = normalizeSlotLabel(selectedDailySlot);
    const hasSelectedSlot = selectableDailySlots.some((slot) => normalizeSlotLabel(slot) === selectedKey);
    if (selectedDailySlot && !hasSelectedSlot) {
      setSelectedDailySlot(selectableDailySlots[0] || '');
    }
  }, [selectableDailySlots, selectedDailySlot]);

  const dailyRows = useMemo(() => {
    const slotStatusByUserId = new Map();
    const selectedSlotKey = normalizeSlotLabel(selectedDailySlot);
    dailyAttendance
      .filter((record) => normalizeSlotLabel(record.timeSlot) === selectedSlotKey)
      .forEach((record) => {
        const userId = record?.userId?._id || record?.userId;
        if (userId) slotStatusByUserId.set(userId.toString(), record.status);
      });

    return studentsInBatch
      .map((student, index) => {
        const status = slotStatusByUserId.get(student.id) || 'not-marked';
        return {
          no: index + 1,
          name: student.fullName,
          status,
        };
      })
      .filter((row) => (dailyStatusFilter === 'all' ? true : row.status === dailyStatusFilter));
  }, [dailyAttendance, selectedDailySlot, studentsInBatch, dailyStatusFilter]);

  const absenteesRows = useMemo(() => {
    const rows = studentsInBatch
      .map((student) => {
        const studentRecords = batchAttendance.filter(
          (record) => dateOnly(record.date) === absenteesDate && (record?.userId?._id || record?.userId)?.toString() === student.id
        );

        const absentSlots = sortSlots(
          studentRecords
            .filter((record) => record.status === 'absent')
            .map((record) => record.timeSlot)
            .filter(Boolean)
        );

        if (absentSlots.length === 0) return null;

        return {
          name: student.fullName,
          absentCount: absentSlots.length,
          absentSlots: absentSlots.join(', '),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.absentCount - a.absentCount || a.name.localeCompare(b.name));

    return rows.map((row, index) => ({ ...row, no: index + 1 }));
  }, [studentsInBatch, batchAttendance, absenteesDate]);

  const hourlyRows = useMemo(() => {
    const monthRecords = batchAttendance.filter((record) => {
      const date = new Date(record.date);
      return date.getFullYear() === Number(hourlyYear) && date.getMonth() === Number(hourlyMonth);
    });

    const uniqueSessions = new Set(
      monthRecords.map((record) => `${dateOnly(record.date)}|${record.timeSlot}`)
    );
    const maxHours = uniqueSessions.size;

    return studentsInBatch.map((student, index) => {
      const studentRecords = monthRecords.filter(
        (record) => (record?.userId?._id || record?.userId)?.toString() === student.id
      );
      const presentHours = studentRecords.filter((record) => record.status === 'present').length;
      const percentage = maxHours > 0 ? ((presentHours / maxHours) * 100).toFixed(1) : '0.0';

      return {
        no: index + 1,
        name: student.fullName,
        presentHours,
        maxHours,
        percentage,
      };
    });
  }, [batchAttendance, hourlyYear, hourlyMonth, studentsInBatch]);

  const monthlyRows = useMemo(() => {
    const monthRecords = batchAttendance.filter((record) => {
      const date = new Date(record.date);
      return date.getFullYear() === Number(monthlyYear) && date.getMonth() === Number(monthlyMonth);
    });

    const uniqueSessions = new Set(
      monthRecords.map((record) => `${dateOnly(record.date)}|${record.timeSlot}`)
    );
    const maxHours = uniqueSessions.size;

    return studentsInBatch.map((student, index) => {
      const studentRecords = monthRecords.filter(
        (record) => (record?.userId?._id || record?.userId)?.toString() === student.id
      );
      const present = studentRecords.filter((record) => record.status === 'present').length;
      const percentage = maxHours > 0 ? ((present / maxHours) * 100).toFixed(1) : '0.0';

      return {
        no: index + 1,
        name: student.fullName,
        present,
        maxHours,
        percentage,
      };
    });
  }, [batchAttendance, monthlyYear, monthlyMonth, studentsInBatch]);

  const dateWiseRows = useMemo(() => {
    if (!rangeStartDate || !rangeEndDate || rangeStartDate > rangeEndDate) return [];

    const rangeRecords = batchAttendance.filter((record) => {
      const recordDate = dateOnly(record.date);
      return recordDate >= rangeStartDate && recordDate <= rangeEndDate;
    });

    return studentsInBatch.map((student, index) => {
      const studentRecords = rangeRecords.filter(
        (record) => (record?.userId?._id || record?.userId)?.toString() === student.id
      );
      const present = studentRecords.filter((record) => record.status === 'present').length;
      const late = studentRecords.filter((record) => record.status === 'late').length;
      const absent = studentRecords.filter((record) => record.status === 'absent').length;
      const total = studentRecords.length;
      const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : '0.0';

      return {
        no: index + 1,
        name: student.fullName,
        present,
        late,
        absent,
        total,
        percentage,
      };
    });
  }, [batchAttendance, studentsInBatch, rangeStartDate, rangeEndDate]);

  const activeTabLabel = useMemo(() => {
    return TABS.find((tab) => tab.id === activeTab)?.label || activeTab;
  }, [activeTab]);

  const canExportCsv = CSV_EXPORT_ALLOWED_TABS.has(activeTab);

  const buildExportRows = () => {
    const rows = [
      ['Attendance Report'],
      ['Batch', selectedBatch || ''],
      ['Report Type', activeTabLabel],
    ];

    if (activeTab === 'daily') {
      rows.push(['Date', dailyDate], ['Selected Slot', selectedDailySlot || ''], ['Status Filter', dailyStatusFilter], []);
      rows.push(['Slot Summary'], ['Hour', 'Time Slot', 'Present', 'Late', 'Absent']);

      if (dailySlotSummary.length === 0) {
        rows.push(['', 'No slot summary found', '', '', '']);
      } else {
        dailySlotSummary.forEach((slotCard) => {
          rows.push([slotCard.hourLabel, slotCard.slot, slotCard.presentCount, slotCard.lateCount, slotCard.absentCount]);
        });
      }

      rows.push([], ['Student Attendance'], ['No', 'Name', 'Status']);
      if (dailyRows.length === 0) {
        rows.push(['', 'No records found', '']);
      } else {
        dailyRows.forEach((row) => {
          rows.push([row.no, row.name, row.status === 'not-marked' ? 'Not Marked' : row.status]);
        });
      }
      return rows;
    }

    if (activeTab === 'absentees') {
      rows.push(['Date', absenteesDate], [], ['No', 'Name', 'Absent Hours', 'Slots']);
      if (absenteesRows.length === 0) {
        rows.push(['', 'No absentees found', '', '']);
      } else {
        absenteesRows.forEach((row) => rows.push([row.no, row.name, row.absentCount, row.absentSlots]));
      }
      return rows;
    }

    if (activeTab === 'hourly') {
      rows.push(['Year', hourlyYear], ['Month', MONTHS[Number(hourlyMonth)]?.label || String(hourlyMonth)], [], ['No', 'Name', 'Present Hours', 'Max Hours', 'Percentage']);
      if (hourlyRows.length === 0) {
        rows.push(['', 'No records found', '', '', '']);
      } else {
        hourlyRows.forEach((row) => rows.push([row.no, row.name, row.presentHours, row.maxHours, `${row.percentage}%`]));
      }
      return rows;
    }

    if (activeTab === 'monthly') {
      rows.push(['Year', monthlyYear], ['Month', MONTHS[Number(monthlyMonth)]?.label || String(monthlyMonth)], [], ['No', 'Name', 'Present', 'Max Hours', 'Percentage']);
      if (monthlyRows.length === 0) {
        rows.push(['', 'No records found', '', '', '']);
      } else {
        monthlyRows.forEach((row) => rows.push([row.no, row.name, row.present, row.maxHours, `${row.percentage}%`]));
      }
      return rows;
    }

    if (activeTab === 'date-wise') {
      rows.push(['Start Date', rangeStartDate], ['End Date', rangeEndDate], [], ['No', 'Name', 'Present', 'Late', 'Absent', 'Total', 'Percentage']);
      if (dateWiseRows.length === 0) {
        rows.push(['', 'No records found', '', '', '', '', '']);
      } else {
        dateWiseRows.forEach((row) => rows.push([row.no, row.name, row.present, row.late, row.absent, row.total, `${row.percentage}%`]));
      }
      return rows;
    }

    return rows;
  };

  const handleExportCsv = () => {
    if (!canExportCsv) return;
    const rows = buildExportRows();
    const csvContent = buildCsvContent(rows);
    const fileDate = toInputDate(new Date());
    const filename = `attendance-report-${sanitizeFilePart(selectedBatch || 'batch')}-${sanitizeFilePart(activeTab)}-${fileDate}.csv`;
    downloadCsvFile(filename, csvContent);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Attendance Report</h1>
        <p className="text-gray-600">Analyze attendance by batch with daily, hourly, monthly and date-wise reports.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg min-w-[240px] focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              {batchOptions.length === 0 ? (
                <option value="">No Batch Found</option>
              ) : (
                batchOptions.map((batchCode) => (
                  <option key={batchCode} value={batchCode}>
                    {batchCode}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Students in batch: <span className="font-semibold text-gray-800">{studentsInBatch.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#6e0718] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {canExportCsv && (
            <button
              onClick={handleExportCsv}
              disabled={!selectedBatch}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6e0718] text-white hover:bg-[#5a0513] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          Loading attendance report...
        </div>
      ) : !selectedBatch ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          Please select a batch to view report.
        </div>
      ) : (
        <>
          {activeTab === 'daily' && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                  <select
                    value={dailyStatusFilter}
                    onChange={(e) => setDailyStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  >
                    <option value="all">All</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {dailySlots.length === 0 && (
                  <div className="text-gray-500 text-sm">No attendance has been recorded for this date.</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  {dailySlotSummary.map((slotCard) => (
                    <button
                      key={`${slotCard.hourLabel}-${slotCard.slot}`}
                      onClick={() => setSelectedDailySlot(slotCard.slot)}
                      className={`border rounded-md p-3 text-left transition-colors ${
                        normalizeSlotLabel(selectedDailySlot) === normalizeSlotLabel(slotCard.slot)
                          ? 'border-[#6e0718] bg-[#fdf4f6]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">{slotCard.hourLabel}</div>
                      <div className="text-sm font-semibold text-gray-800 mb-2">{slotCard.slot}</div>
                      <div className="text-xs text-gray-600">
                        P: {slotCard.presentCount} | L: {slotCard.lateCount} | A: {slotCard.absentCount}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dailyRows.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                          No students found for this filter.
                        </td>
                      </tr>
                    ) : (
                      dailyRows.map((row) => (
                        <tr key={`${row.no}-${row.name}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{row.no}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{row.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                STATUS_STYLES[row.status]
                              }`}
                            >
                              {row.status === 'not-marked' ? 'Not Marked' : row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'absentees' && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={absenteesDate}
                    onChange={(e) => setAbsenteesDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Total absentees: <span className="font-semibold text-red-700">{absenteesRows.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Absent Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {absenteesRows.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          No absentees found for selected date.
                        </td>
                      </tr>
                    ) : (
                      absenteesRows.map((row) => (
                        <tr key={`${row.no}-${row.name}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{row.no}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-red-700 font-semibold">{row.absentCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.absentSlots}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hourly' && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={hourlyYear}
                    onChange={(e) => setHourlyYear(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={hourlyMonth}
                    onChange={(e) => setHourlyMonth(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  >
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Present Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Max Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hourlyRows.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No data found.
                        </td>
                      </tr>
                    ) : (
                      hourlyRows.map((row) => (
                        <tr key={`${row.no}-${row.name}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{row.no}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.presentHours}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.maxHours}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={monthlyYear}
                    onChange={(e) => setMonthlyYear(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={monthlyMonth}
                    onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  >
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Present</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Max Hours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthlyRows.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No data found for selected month.
                        </td>
                      </tr>
                    ) : (
                      monthlyRows.map((row) => (
                        <tr key={`${row.no}-${row.name}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{row.no}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-green-700">{row.present}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.maxHours}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'date-wise' && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                {rangeStartDate > rangeEndDate && (
                  <div className="text-sm text-red-600">Start date must be on or before end date.</div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Present</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Late</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Absent</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dateWiseRows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          No data found for this date range.
                        </td>
                      </tr>
                    ) : (
                      dateWiseRows.map((row) => (
                        <tr key={`${row.no}-${row.name}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{row.no}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-green-700">{row.present}</td>
                          <td className="px-4 py-3 text-sm text-yellow-700">{row.late}</td>
                          <td className="px-4 py-3 text-sm text-red-700">{row.absent}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.total}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceReport;
