document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetId = tab.dataset.tab + 'Tab';
            tabContents.forEach(content => {
                content.style.display = content.id === targetId ? 'block' : 'none';
            });

            if (targetId === 'listTab') {
                loadFacesList();
            }
        });
    });

    // Register Face
    const registerFileInput = document.getElementById('registerFileInput');
    const registerButton = document.getElementById('registerButton');
    const registerPreview = document.getElementById('registerPreview');
    const personName = document.getElementById('personName');
    const loadingSpinner = document.getElementById('loadingSpinner');

    registerFileInput.addEventListener('change', function() {
        if (this.files[0]) {
            registerPreview.innerHTML = `<img src="${URL.createObjectURL(this.files[0])}">`;
        }
    });

    registerButton.addEventListener('click', async function() {
        if (!registerFileInput.files[0] || !personName.value) {
            alert('Please select an image and enter a name');
            return;
        }

        loadingSpinner.style.display = 'block';
        const formData = new FormData();
        formData.append('image', registerFileInput.files[0]);
        formData.append('name', personName.value);

        try {
            const response = await fetch('/api/face/register', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                alert('Face registered successfully!');
                registerFileInput.value = '';
                personName.value = '';
                registerPreview.innerHTML = '';
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error registering face: ' + error.message);
        }

        loadingSpinner.style.display = 'none';
    });

    // Authentication
    const authFileInput = document.getElementById('authFileInput');
    const authenticateButton = document.getElementById('authenticateButton');
    const authPreview = document.getElementById('authPreview');
    const authResult = document.getElementById('authResult');

    authFileInput.addEventListener('change', function() {
        if (this.files[0]) {
            authPreview.innerHTML = `<img src="${URL.createObjectURL(this.files[0])}">`;
        }
    });

    authenticateButton.addEventListener('click', async function() {
        if (!authFileInput.files[0]) {
            alert('Please select an image');
            return;
        }

        loadingSpinner.style.display = 'block';
        const formData = new FormData();
        formData.append('image', authFileInput.files[0]);

        try {
            const response = await fetch('/api/face/authenticate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            authResult.innerHTML = '';
            
            const resultDiv = document.createElement('div');
            resultDiv.className = data.authenticated ? 'success' : 'error';
            
            if (data.authenticated) {
                resultDiv.innerHTML = `
                    <h3>Authentication Successful!</h3>
                    <p>Person: ${data.personName}</p>
                    <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
                `;
            } else {
                resultDiv.innerHTML = `
                    <h3>Authentication Failed</h3>
                    <p>${data.message}</p>
                `;
            }
            
            authResult.appendChild(resultDiv);
        } catch (error) {
            alert('Error authenticating: ' + error.message);
        }

        loadingSpinner.style.display = 'none';
    });

    // Face List
    const refreshList = document.getElementById('refreshList');
    const facesList = document.getElementById('facesList');

    async function loadFacesList() {
        loadingSpinner.style.display = 'block';
        try {
            const response = await fetch('/api/face/list');
            const faces = await response.json();

            facesList.innerHTML = '';
            faces.forEach(face => {
                const card = document.createElement('div');
                card.className = 'face-card';
                card.innerHTML = `
                    <div class="face-info">
                        <h3>${face.personName}</h3>
                        <p>Registered: ${new Date(face.timestamp).toLocaleDateString()}</p>
                    </div>
                `;
                facesList.appendChild(card);
            });
        } catch (error) {
            alert('Error loading faces: ' + error.message);
        }
        loadingSpinner.style.display = 'none';
    }

    refreshList.addEventListener('click', loadFacesList);
});
