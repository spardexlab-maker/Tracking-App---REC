import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { Icon, Button, Header } from 'semantic-ui-react';
import selectors from '../../../selectors';
import Paths from '../../../constants/Paths';
import styles from './CalendarView.module.scss';

const CalendarView = React.memo(({ cardIds }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  // Fetch all cards and their details
  const cards = useSelector((state) => {
    return cardIds
      .map((id) => selectCardById(state, id))
      .filter((card) => !!card && !!card.dueDate);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Compute days in month and start offset
  const { calendarCells, monthLabel } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday

    const cells = [];
    const today = new Date();

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      cells.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      cells.push({ date, isCurrentMonth: true, isToday });
    }

    // Next month padding to fill grid (usually 35 or 42 cells)
    const totalCellsNeeded = cells.length > 35 ? 42 : 35;
    const nextMonthPadding = totalCellsNeeded - cells.length;
    for (let day = 1; day <= nextMonthPadding; day++) {
      const date = new Date(year, month + 1, day);
      cells.push({ date, isCurrentMonth: false });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      calendarCells: cells,
      monthLabel: `${monthNames[month]} ${year}`,
    };
  }, [year, month]);

  // Group cards by day (YYYY-MM-DD)
  const cardsByDate = useMemo(() => {
    const groups = {};
    cards.forEach((card) => {
      const d = new Date(card.dueDate);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(card);
    });
    return groups;
  }, [cards]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.wrapper}>
      {/* Calendar Header */}
      <div className={styles.header}>
        <div className={styles.navigation}>
          <Button icon onClick={handlePrevMonth} className={styles.navButton}>
            <Icon name="chevron left" />
          </Button>
          <Button onClick={handleToday} className={styles.todayButton}>
            Today
          </Button>
          <Button icon onClick={handleNextMonth} className={styles.navButton}>
            <Icon name="chevron right" />
          </Button>
        </div>
        <Header as="h2" className={styles.monthLabel}>
          {monthLabel}
        </Header>
      </div>

      {/* Weekdays Labels */}
      <div className={styles.weekdaysGrid}>
        {daysOfWeek.map((day) => (
          <div key={day} className={styles.weekdayLabel}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className={styles.daysGrid}>
        {calendarCells.map(({ date, isCurrentMonth, isToday }, idx) => {
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const dayCards = cardsByDate[dateKey] || [];

          return (
            <div
              key={idx}
              className={classNames(
                styles.dayCell,
                !isCurrentMonth && styles.paddedDay,
                isToday && styles.todayDay
              )}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              <div className={styles.cardContainer}>
                {dayCards.map((card) => (
                  <Link
                    key={card.id}
                    to={Paths.CARDS.replace(':id', card.id)}
                    className={styles.cardLink}
                  >
                    <div
                      className={classNames(
                        styles.cardBadge,
                        card.isDueCompleted && styles.completedCard
                      )}
                    >
                      {card.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CalendarView.propTypes = {
  cardIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CalendarView;
