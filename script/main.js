document.addEventListener('DOMContentLoaded', () => {
    const bioInput = document.getElementById('bioInput');
    const addBioButton = document.getElementById('addBio');
    const bioList = document.getElementById('bioList');
    const planInput = document.getElementById('planInput');
    const commitmentLevel = document.getElementById('commitmentLevel');
    const showExample = document.getElementById('showExample');
    const schedulerForm = document.getElementById('schedulerForm');
    const scheduleBody = document.getElementById('scheduleBody');

    // Load stored bio array
    let bioArray = [];
    const storedBio = localStorage.getItem('userBio');
    try {
        if (storedBio) {
            const parsed = JSON.parse(storedBio);
            if (Array.isArray(parsed)) {
                bioArray = parsed;
            } else {
                bioArray = storedBio.split(' - ').filter(item => item.trim());
            }
        }
    } catch (e) {
        console.error("Error parsing stored bio, resetting:", e);
        bioArray = [];
        localStorage.setItem('userBio', JSON.stringify(bioArray));
    }

    // Function to render the bio list with remove buttons
    const renderBioList = () => {
        bioList.innerHTML = bioArray.map((item, index) => `
            <li>
                ${item}
                <button class="removeBio" data-index="${index}">Remove</button>
            </li>
        `).join('');
    };

    // Initial render of bio list
    if (bioArray.length > 0) {
        renderBioList();
    }

    // Add bio item
    if (addBioButton) {
        addBioButton.addEventListener('click', () => {
            const userInput = bioInput.value.trim();
            if (userInput) {
                bioArray.push(userInput);
                renderBioList();
                localStorage.setItem('userBio', JSON.stringify(bioArray));
                bioInput.value = '';
            } else {
                alert('Please enter some information about yourself!');
            }
        });
    }

    // Remove bio item
    bioList.addEventListener('click', (event) => {
        if (event.target.classList.contains('removeBio')) {
            const index = parseInt(event.target.getAttribute('data-index'));
            if (!isNaN(index) && index >= 0 && index < bioArray.length) {
                bioArray.splice(index, 1);
                renderBioList();
                localStorage.setItem('userBio', JSON.stringify(bioArray));
            }
        }
    });

    // Generate time slots (8:00 AM to 8:00 PM)
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
        timeSlots.push(`${hour}:00`);
    }

    // Initialize the table with empty time slots
    const initializeTable = () => {
        scheduleBody.innerHTML = timeSlots.map(time => `
            <tr>
                <td>${time}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `).join('');
    };
    initializeTable();

    // Parse API response and update table
    const updateScheduleTable = (scheduleText) => {
        // Reset table
        initializeTable();

        // Parse the schedule text (example format: "Monday:\n- 9:00 AM - 12:00 PM: Code")
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let currentDayIndex = -1;

        const lines = scheduleText.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // Check for day headers
            const dayMatch = days.findIndex(day => line.startsWith(day));
            if (dayMatch !== -1) {
                currentDayIndex = dayMatch;
                return;
            }

            // Parse time slots and tasks (e.g., "- 9:00 AM - 12:00 PM: Code")
            const taskMatch = line.match(/- (\d{1,2}:\d{2} [AP]M) - (\d{1,2}:\d{2} [AP]M): (.+)/);
            if (taskMatch && currentDayIndex !== -1) {
                const startTime = taskMatch[1];
                const endTime = taskMatch[2];
                const task = taskMatch[3];

                // Convert times to 24-hour format for comparison
                const parseTime = (timeStr) => {
                    const [time, period] = timeStr.split(' ');
                    let [hour, minute] = time.split(':').map(Number);
                    if (period === 'PM' && hour !== 12) hour += 12;
                    if (period === 'AM' && hour === 12) hour = 0;
                    return hour + minute / 60;
                };

                const startHour = parseTime(startTime);
                const endHour = parseTime(endTime);

                // Find the row(s) to fill
                timeSlots.forEach((slot, rowIndex) => {
                    const slotHour = parseTime(slot);
                    if (slotHour >= startHour && slotHour < endHour) {
                        const row = scheduleBody.rows[rowIndex];
                        if (row) {
                            const cell = row.cells[currentDayIndex + 1]; // +1 to skip the time column
                            cell.textContent = task;
                        }
                    }
                });
            }
        });
    };

    // Form submission to generate schedule
    schedulerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const bio = bioArray;
        const plan = planInput.value.trim();
        const commitment = commitmentLevel.value;

        if (!plan) {
            alert('Please enter your weekly plan!');
            return;
        }

        try {
            const response = await fetch('/generate-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio, plan, commitment })
            });

            const data = await response.json();
            if (data.error) {
                alert('Error generating schedule: ' + data.error);
                return;
            }

            // Update the table with the new schedule
            updateScheduleTable(data.schedule);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate schedule. Check the console for details.');
        }
    });

    // Example button
    if (showExample) {
        showExample.addEventListener('click', () => {
            bioArray = ['Student at UiO', 'Studying programming'];
            renderBioList();
            planInput.value = 'Code 10 hrs, Read Nietzsche 5 hrs';
            commitmentLevel.value = 'middels';

            // Mock API response for example
            const mockSchedule = `
Monday:
- 9:00 AM - 12:00 PM: Code
- 1:00 PM - 2:00 PM: Read Nietzsche

Tuesday:
- 10:00 AM - 1:00 PM: Code

Level Progress: Level 2 (15/30 points)
- +5 for coding, +2 daily bonus.

Commentary: The Übermensch does not drift—your coding shapes your destiny.
            `;
            updateScheduleTable(mockSchedule);
        });
    }
});