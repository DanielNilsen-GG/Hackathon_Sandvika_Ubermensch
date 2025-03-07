document.addEventListener('DOMContentLoaded', () => {
    const bioInput = document.getElementById('bioInput');
    const addBioButton = document.getElementById('addBio');
    const bioList = document.getElementById('bioList');
    const planInput = document.getElementById('planInput');
    const commitmentLevel = document.getElementById('commitmentLevel');
    const showExample = document.getElementById('showExample');
    const schedulerForm = document.getElementById('schedulerForm');

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

    // Initial render
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

            // Display the schedule
            const scheduleDiv = document.createElement('div');
            scheduleDiv.id = 'scheduleDisplay';
            scheduleDiv.innerHTML = `<h3>Din plan:</h3><pre>${data.schedule}</pre>`;
            document.body.appendChild(scheduleDiv);
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
            alert('Example loaded! Click "Generer plan" to see the schedule.');
        });
    }
});