/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 84: EVENT CALENDAR & MATCH SCHEDULE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Event management, match scheduling, notifications, calendar views
 * Features: Multi-league support, live updates, reminders, timezone handling
 * 
 * Version: 1.0.0
 * Status: ACTIVE RUNTIME
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CONFIG = {
        calendar: {
            configPath: '../api-json/calendar-config.json',
            updateInterval: 60000, // 1 minute
            notificationsBefore: [60, 15, 5] // minutes before event
        },
        events: {
            eventAdded: 'calendar:event-added',
            eventUpdated: 'calendar:event-updated',
            eventStarting: 'calendar:event-starting',
            scheduleUpdated: 'calendar:schedule-updated'
        }
    };

    const state = {
        events: new Map(),
        leagues: new Map(),
        teams: new Map(),
        notifications: new Map(),
        config: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const EventManager = {
        add: function (event) {
            const id = event.id || this.generateId();

            const eventObj = {
                id,
                title: event.title,
                description: event.description || '',
                type: event.type || 'match',
                league: event.league,
                homeTeam: event.homeTeam,
                awayTeam: event.awayTeam,
                venue: event.venue || '',
                startTime: new Date(event.startTime),
                endTime: event.endTime ? new Date(event.endTime) : null,
                status: event.status || 'scheduled',
                score: event.score || null,
                live: event.live || false,
                featured: event.featured || false,
                timestamp: Date.now()
            };

            state.events.set(id, eventObj);

            // Schedule notifications
            this.scheduleNotifications(eventObj);

            const evt = new CustomEvent(CONFIG.events.eventAdded, {
                detail: { event: eventObj, timestamp: Date.now() }
            });
            document.dispatchEvent(evt);

            console.log('📅 [Calendar] Event added:', eventObj.title);
            return eventObj;
        },

        update: function (eventId, updates) {
            const event = state.events.get(eventId);
            if (!event) return false;

            Object.assign(event, updates);

            const evt = new CustomEvent(CONFIG.events.eventUpdated, {
                detail: { eventId, updates, timestamp: Date.now() }
            });
            document.dispatchEvent(evt);

            return true;
        },

        get: function (eventId) {
            return state.events.get(eventId);
        },

        getAll: function (filter = {}) {
            let events = Array.from(state.events.values());

            if (filter.league) {
                events = events.filter(e => e.league === filter.league);
            }

            if (filter.team) {
                events = events.filter(e =>
                    e.homeTeam === filter.team || e.awayTeam === filter.team
                );
            }

            if (filter.status) {
                events = events.filter(e => e.status === filter.status);
            }

            if (filter.date) {
                const targetDate = new Date(filter.date);
                events = events.filter(e =>
                    this.isSameDay(e.startTime, targetDate)
                );
            }

            if (filter.dateRange) {
                const start = new Date(filter.dateRange.start);
                const end = new Date(filter.dateRange.end);
                events = events.filter(e =>
                    e.startTime >= start && e.startTime <= end
                );
            }

            return events.sort((a, b) => a.startTime - b.startTime);
        },

        getUpcoming: function (days = 7) {
            const now = new Date();
            const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

            return this.getAll({
                dateRange: { start: now, end: future },
                status: 'scheduled'
            });
        },

        getLive: function () {
            return Array.from(state.events.values())
                .filter(e => e.live || e.status === 'live');
        },

        isSameDay: function (date1, date2) {
            return date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate();
        },

        scheduleNotifications: function (event) {
            CONFIG.calendar.notificationsBefore.forEach(minutes => {
                const notifTime = event.startTime.getTime() - (minutes * 60 * 1000);
                const now = Date.now();

                if (notifTime > now) {
                    const delay = notifTime - now;
                    const timerId = setTimeout(() => {
                        NotificationManager.send(event, minutes);
                    }, delay);

                    state.notifications.set(`${event.id}_${minutes}`, timerId);
                }
            });
        },

        generateId: function () {
            return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LEAGUE MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const LeagueManager = {
        register: function (league) {
            state.leagues.set(league.id, {
                id: league.id,
                name: league.name,
                sport: league.sport || 'football',
                country: league.country || '',
                logo: league.logo || '',
                color: league.color || '#1e40af'
            });

            console.log('🏆 [Calendar] League registered:', league.name);
        },

        getAll: function () {
            return Array.from(state.leagues.values());
        },

        get: function (leagueId) {
            return state.leagues.get(leagueId);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const TeamManager = {
        register: function (team) {
            state.teams.set(team.id, {
                id: team.id,
                name: team.name,
                shortName: team.shortName || team.name,
                logo: team.logo || '',
                color: team.color || '#1e40af'
            });
        },

        getAll: function () {
            return Array.from(state.teams.values());
        },

        get: function (teamId) {
            return state.teams.get(teamId);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CALENDAR RENDERER
    // ═══════════════════════════════════════════════════════════════════════

    const CalendarRenderer = {
        renderMonth: function (year, month) {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDay = firstDay.getDay();
            const daysInMonth = lastDay.getDate();

            let html = '<div class="calendar-month">';
            html += `<div class="calendar-header">${this.getMonthName(month)} ${year}</div>`;
            html += '<div class="calendar-grid">';

            // Day headers
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(day => {
                html += `<div class="calendar-day-header">${day}</div>`;
            });

            // Empty cells before first day
            for (let i = 0; i < startDay; i++) {
                html += '<div class="calendar-day empty"></div>';
            }

            // Days of month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const events = EventManager.getAll({ date });
                const hasEvents = events.length > 0;
                const isToday = this.isToday(date);

                html += `<div class="calendar-day ${hasEvents ? 'has-events' : ''} ${isToday ? 'today' : ''}">`;
                html += `<div class="day-number">${day}</div>`;
                if (hasEvents) {
                    html += `<div class="event-count">${events.length}</div>`;
                }
                html += '</div>';
            }

            html += '</div></div>';
            return html;
        },

        renderSchedule: function (events) {
            let html = '<div class="schedule-list">';

            if (events.length === 0) {
                html += '<div class="schedule-empty">No events scheduled</div>';
            }

            events.forEach(event => {
                const league = LeagueManager.get(event.league);
                const homeTeam = TeamManager.get(event.homeTeam);
                const awayTeam = TeamManager.get(event.awayTeam);

                html += '<div class="schedule-item">';
                html += '<div class="schedule-time">';
                html += `${this.formatTime(event.startTime)}`;
                html += '</div>';
                html += '<div class="schedule-details">';
                html += `<div class="schedule-league">${league?.name || event.league}</div>`;
                html += '<div class="schedule-match">';
                html += `<span class="team">${homeTeam?.name || event.homeTeam}</span>`;
                html += '<span class="vs">vs</span>';
                html += `<span class="team">${awayTeam?.name || event.awayTeam}</span>`;
                html += '</div>';
                if (event.live) {
                    html += '<div class="schedule-badge live">LIVE</div>';
                }
                html += '</div>';
                html += '</div>';
            });

            html += '</div>';
            return html;
        },

        getMonthName: function (month) {
            const names = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            return names[month];
        },

        formatTime: function (date) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        isToday: function (date) {
            const today = new Date();
            return date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // NOTIFICATION MANAGER
    // ═══════════════════════════════════════════════════════════════════════

    const NotificationManager = {
        send: function (event, minutesBefore) {
            const message = minutesBefore === 0
                ? `${event.title} is starting now!`
                : `${event.title} starts in ${minutesBefore} minutes`;

            const evt = new CustomEvent(CONFIG.events.eventStarting, {
                detail: { event, minutesBefore, message, timestamp: Date.now() }
            });
            document.dispatchEvent(evt);

            console.log('🔔 [Calendar] Notification:', message);

            // Browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('SportIQ Event', { body: message, icon: '⚽' });
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    const AutoUpdate = {
        start: function () {
            this.checkLiveEvents();
            this.timerId = setInterval(() => {
                this.checkLiveEvents();
            }, CONFIG.calendar.updateInterval);
        },

        checkLiveEvents: function () {
            const now = Date.now();

            state.events.forEach(event => {
                const startTime = event.startTime.getTime();
                const isLive = now >= startTime &&
                    (event.endTime ? now <= event.endTime.getTime() :
                        now <= startTime + (2 * 60 * 60 * 1000)); // 2 hours

                if (isLive && !event.live) {
                    event.live = true;
                    event.status = 'live';
                    EventManager.update(event.id, { live: true, status: 'live' });
                } else if (!isLive && event.live) {
                    event.live = false;
                    event.status = 'finished';
                    EventManager.update(event.id, { live: false, status: 'finished' });
                }
            });
        },

        stop: function () {
            if (this.timerId) clearInterval(this.timerId);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initialize() {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📅 LAYER 84: EVENT CALENDAR ENGINE INITIALIZING');
        console.log('═══════════════════════════════════════════════════════════════');

        try {
            const response = await fetch(CONFIG.calendar.configPath);
            if (response.ok) {
                state.config = await response.json();

                // Register leagues
                if (state.config.leagues) {
                    state.config.leagues.forEach(league => {
                        LeagueManager.register(league);
                    });
                    console.log(`✅ [Calendar] Registered ${state.config.leagues.length} leagues`);
                }

                // Register teams
                if (state.config.teams) {
                    state.config.teams.forEach(team => {
                        TeamManager.register(team);
                    });
                    console.log(`✅ [Calendar] Registered ${state.config.teams.length} teams`);
                }

                // Add events
                if (state.config.events) {
                    state.config.events.forEach(event => {
                        EventManager.add(event);
                    });
                    console.log(`✅ [Calendar] Loaded ${state.config.events.length} events`);
                }
            }
        } catch (error) {
            console.warn('⚠️ [Calendar] Failed to load config');
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Start auto-update
        AutoUpdate.start();

        console.log('✅ [Calendar] Engine initialized');
        console.log('═══════════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.EventCalendar = {
        // Events
        addEvent: EventManager.add.bind(EventManager),
        updateEvent: EventManager.update.bind(EventManager),
        getEvent: EventManager.get.bind(EventManager),
        getEvents: EventManager.getAll.bind(EventManager),
        getUpcoming: EventManager.getUpcoming.bind(EventManager),
        getLiveEvents: EventManager.getLive.bind(EventManager),

        // Leagues
        registerLeague: LeagueManager.register.bind(LeagueManager),
        getLeagues: LeagueManager.getAll.bind(LeagueManager),

        // Teams
        registerTeam: TeamManager.register.bind(TeamManager),
        getTeams: TeamManager.getAll.bind(TeamManager),

        // Rendering
        renderMonth: CalendarRenderer.renderMonth.bind(CalendarRenderer),
        renderSchedule: CalendarRenderer.renderSchedule.bind(CalendarRenderer),

        CONFIG
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
