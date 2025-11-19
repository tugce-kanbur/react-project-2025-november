/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";

import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";

import FullCalendar from "@fullcalendar/react";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

import type { EventInput } from "@fullcalendar/core/index.js";

import "../profileCalendar.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );
  const [pairHighlights, setPairHighlights] = useState<Record<string,string>>({});

  const [selectedEvent, setSelectedEvent] = useState<{
    staffName: string;
    shiftName: string;
    date: string;
    start: string;
    end: string;
    partnerName?:string | null;
  } | null > (null);

  const BG_CLASSES =[
    "bg-one",
  "bg-two",
  "bg-three",
  "bg-four",
  "bg-five",
  "bg-six",
  "bg-seven",
  "bg-eight",
  "bg-nine",
  "bg-ten",
  "bg-eleven",
  "bg-twelve",
  "bg-thirteen",
  "bg-fourteen",
  "bg-fifteen",
  "bg-sixteen",
  "bg-seventeen",
  "bg-eighteen",
  "bg-nineteen",
  "bg-twenty",
  "bg-twenty-one",
  "bg-twenty-two",
  "bg-twenty-three",
  "bg-twenty-four",
  "bg-twenty-five",
  "bg-twenty-six",
  "bg-twenty-seven",
  "bg-twenty-eight",
  "bg-twenty-nine",
  "bg-thirty",
  "bg-thirty-one",
  "bg-thirty-two",
  "bg-thirty-three",
  "bg-thirty-four",
  "bg-thirty-five",
  "bg-thirty-six",
  "bg-thirty-seven",
  "bg-thirty-eight",
  "bg-thirty-nine",
  "bg-forty",
  ]

  const getStaffBgClass = (staffId: string) => {
    const index = schedule.staffs.findIndex((s) => s.id === staffId);
    if(index <  0) return "bg-null";
    return BG_CLASSES[index % BG_CLASSES.length];
  };

  const getShiftClass = (shiftId: string) => {
    const shift = schedule.shifts.find((sh) => sh.id === shiftId);
    if (!shift) return "";

    const name = shift.name.toLowerCase();
    if (name.includes("morning")) return "shift-morning";
    if (name.includes("night")) return "shift-night";

    return "shift-other";
  }

  const PAIR_COLORS = [
    "#FCC729",
    "#FF8847",
    "#C0C033",
    "#32A852",
    "#32A8A2",
    "#327BA8",
    "#3244A8",
    "#5A32A8",
    "#A832A4",
    "#FFFE88",
    "#C2068A",
    "#C28D06",
    "#A2C206",
    "#3BC206",
    "#108F7C",
    "#10278F"
  ];

  const getStaffColorForPair = (staffId: string) => {
    const index = schedule.staffs.findIndex((s) => s.id === staffId);
    if (index < 0) return "rgba(194, 6, 138, 0.5)";
    return PAIR_COLORS[index % PAIR_COLORS.length];
  };


  const getPlugins = () => {
    const plugins = [dayGridPlugin];
    plugins.push(interactionPlugin);
    return plugins;
  };

  const getShiftById = (id: string) => {
    return schedule?.shifts?.find((shift) => id === shift.id);
  };

  const getAssigmentById = (id: string) => {
    return schedule?.assignments?.find((assign) => id === assign.id);
  };

  const validDates = () => {
    const dates: string[] = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    while (
      currentDate.isBefore(schedule.scheduleEndDate) ||
      currentDate.isSame(schedule.scheduleEndDate)
    ) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  };

  const buildPairHiglights = (staffId: string | null) => {
    if (!staffId) {
      setPairHighlights({});
      return;
    }

    const map: Record<string, string> = {};

    const staffAssigments = schedule.assignments.filter((a) => a.staffId === staffId);
    staffAssigments.forEach((assing) => {
      const dateKey = dayjs.utc(assing.shiftStart).format("YYYY-MM-DD");
      const shiftId = assing.shiftId;

      const partnerAssigment = schedule.assignments.find((a) => {
        if(a.staffId === staffId) return false;
        if(a.shiftId !== shiftId) return false;
        
        const aDate = dayjs.utc(a.shiftStart).format("YYYY-MM-DD");
        return aDate === dateKey;
      });

      if(partnerAssigment){
        map[dateKey] = partnerAssigment.staffId;
      }
    });

    setPairHighlights(map);
  };


  const generateStaffBasedCalendar = () => {
    if(!selectedStaffId) return;
    const works: EventInput[] = [];

    const filteredAssignments = schedule?.assignments?.filter(
      (assign) => assign.staffId === selectedStaffId
    ) || [];

    for (let i = 0; i < filteredAssignments.length; i++) {
      const assignment = filteredAssignments[i];
      const assignmentDate = dayjs
        .utc(assignment.shiftStart)
        .format("YYYY-MM-DD");
      const isValidDate = validDates().includes(assignmentDate);
      const staffClass = getStaffBgClass(assignment.staffId);
      const shiftClass = getShiftClass(assignment.shiftId);

      const updatedClass = getAssigmentById(assignment.id)?.isUpdated ? "highlight" : "";
      
      const invalidClass = !isValidDate ? "invalid-date" : "";
      
      const color = getStaffColorForPair(assignment.staffId);

      const work: EventInput = {
        id: assignment.id,
        title: getShiftById(assignment.shiftId)?.name,
        duration: "01:00",
        date: assignmentDate,
        staffId: assignment.staffId,
        shiftId: assignment.shiftId,
        className: `event ${staffClass} ${shiftClass} ${updatedClass} ${invalidClass}`,
        backgroundColor: color,
        borderColor: color,
      };
      works.push(work);
    }
    const staff = schedule.staffs.find((s) => s.id === selectedStaffId);
    const offDayKeys = staff?.offDays?.map((d) => dayjs(d, "DD.MM.YYYY").format("YYYY-MM-DD")) || [];

    setHighlightedDates(offDayKeys);
    setEvents(works);

    buildPairHiglights(selectedStaffId);
  };

  useEffect(() => {
    if(schedule?.staffs?.length) {
    const firstStaffId = schedule?.staffs?.[0]?.id;
    setSelectedStaffId(firstStaffId);
    }
  }, [schedule]);

  useEffect(() => {
    if(selectedStaffId) {
    generateStaffBasedCalendar();
    }
  }, [selectedStaffId, schedule]);

  const RenderEventContent = ({ eventInfo }: any) => {
    return (
      <div className="event-content">
        <p>{eventInfo.event.title}</p>
      </div>
    );
  };

  return (
    <div className="calendar-section">
      <div className="calendar-wrapper">
        <div className="staff-list">
          {schedule?.staffs?.map((staff: any) => (
            <div
              key={staff.id}
              onClick={() => {
                setSelectedStaffId(staff.id);
                setSelectedEvent(null);
              }}
              className={`staff ${getStaffBgClass(staff.id)} ${
                staff.id === selectedStaffId ? "active" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z" />
              </svg>
              <span>{staff.name}</span>
            </div>
          ))}
        </div>
        {selectedEvent && (
          <div className="event-detail-popup">
            <div className="event-detail-content">
              <div className="event-detail-header">
                <h3>{selectedEvent.staffName}</h3>
                <button className="event-detail-close"
                        onClick={() => setSelectedEvent(null)}
                >
                  x
                </button>
                <p>
                <strong>Shift:</strong> {selectedEvent.shiftName}
                </p>
                <p>
                <strong>Tarih:</strong> {selectedEvent.date}
                </p>
                <p>
                <strong>Saat:</strong> {selectedEvent.start} -{" "}
                {selectedEvent.end}
                </p>
                {selectedEvent.partnerName && (
                <p>
                <strong>Birlikte çalıştığı kişi:</strong> {selectedEvent.partnerName}
                </p>
                )}
              </div>
            </div>  
        </div>
        )}
        <FullCalendar
          ref={calendarRef}
          locale={auth.language}
          plugins={getPlugins()}
          contentHeight={400}
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={true}
          showNonCurrentDates={true}
          eventContent={(eventInfo: any) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          eventClick={(info) => {
            const event = info.event;
            
            const staffId = event.extendedProps.staffId as string;
            const shiftId = event.extendedProps.shiftId as string;

            const staff = schedule.staffs.find((s) => s.id === staffId);
            const shift = schedule.shifts.find((s) => s.id === shiftId);
            const assignment = schedule.assignments.find((a) => a.id === event.id);

            const dateKey = dayjs(event.start!).format("YYYY-MM-DD");
            const partnerStaffId = pairHighlights[dateKey];
            const partnerStaff = partnerStaffId 
            ? schedule.staffs.find((s) => s.id === partnerStaffId)
            : undefined;

            setSelectedEvent({
              staffName: staff?.name || "",
              shiftName: shift?.name || "",
              date: dayjs(event.start!).format("DD-MM.YYYY"),
              start: assignment
              ? dayjs(assignment.shiftStart).format("HH:mm")
              : "",
              end: assignment
              ? dayjs(assignment.shiftEnd).format("HH:mm")
              : "",
              partnerName: partnerStaff?.name || null,
          });
          }} 
          datesSet={(info: any) => {
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;

            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule?.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate()
              )
            )
              setInitialDate(calendarRef?.current?.getApi().getDate());

            const startDiff = dayjs(info.start)
              .utc()
              .diff(
                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                "days"
              );
            const endDiff = dayjs(dayjs(schedule.scheduleEndDate)).diff(
              info.end,
              "days"
            );
            if (startDiff < 0 && startDiff > -35) prevButton.disabled = true;
            else prevButton.disabled = false;

            if (endDiff < 0 && endDiff > -32) nextButton.disabled = true;
            else nextButton.disabled = false;
          }}
          dayCellContent={({ date }) => {
            const iso = dayjs(date).format("YYYY-MM-DD");

            const found = validDates().includes(iso);
            const isOffDay = highlightedDates.includes(iso);
            const partnerStaffId = pairHighlights[iso];
            const isPairDay = !!partnerStaffId;

            const pairStyle = isPairDay 
            ? {
              borderBottom: `5px solid ${getStaffColorForPair(
              partnerStaffId
              )}`,
            }
            :
            {};

            return (
              <div
                className={`${found ? "" : "date-range-disabled"} ${
                  isOffDay ? "highlighted-date-orange" : ""
                } ${isPairDay ? "highlightedPair" : ""}`}
                style = {pairStyle}
              >
                {dayjs(date).date()}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default CalendarContainer;
