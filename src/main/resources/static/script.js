
const API_URL = "/api/placements";
const AUTH_URL = "/api/auth";

let placements = [];
let currentStudent = null;

// =====================================
// 1. COMMON HELPER FUNCTIONS
// =====================================

async function getErrorMessage(response) {
    try {
        const errorData = await response.json();

        if (errorData.errors) {
            return errorData.errors.join("\n");
        }

        return errorData.message || "Something went wrong!";
    } catch {
        return "Something went wrong! Please try again.";
    }
}

function showLoginScreen() {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("registerScreen").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
}

function showRegisterScreen() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("registerScreen").style.display = "flex";
    document.getElementById("dashboard").style.display = "none";
}

function showDashboard(name) {
    currentStudent = name || "Student";

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("registerScreen").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";

    document.getElementById("loggedInName").textContent = currentStudent;
    document.querySelector(".profile-icon").textContent =
        currentStudent.charAt(0).toUpperCase();
}

// =====================================
// 2. SWITCH BETWEEN LOGIN AND REGISTER
// =====================================

document.getElementById("showRegister").addEventListener("click", function(event) {
    event.preventDefault();
    showRegisterScreen();
});

document.getElementById("showLogin").addEventListener("click", function(event) {
    event.preventDefault();
    showLoginScreen();
});

// =====================================
// 3. STUDENT REGISTRATION
// =====================================

document.getElementById("registerForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const registerData = {
        fullName: document.getElementById("registerName").value.trim(),
        email: document.getElementById("registerEmail").value.trim(),
        password: document.getElementById("registerPassword").value
    };

    const message = document.getElementById("registerMessage");
    message.textContent = "Creating your account...";

    try {
        const response = await fetch(`${AUTH_URL}/register`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(registerData)
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        message.style.color = "#86efac";
        message.textContent = "Registration successful! Please log in.";

        this.reset();

        setTimeout(() => {
            showLoginScreen();
            document.getElementById("loginEmail").value = registerData.email;
        }, 1200);

    } catch (error) {
        message.style.color = "#fca5a5";
        message.textContent = error.message;
    }
});

// =====================================
// 4. STUDENT LOGIN
// =====================================

document.getElementById("loginForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const loginData = {
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value
    };

    const message = document.getElementById("loginMessage");
    message.textContent = "Logging in...";

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const result = await response.json();

        showDashboard(result.name);
        await loadPlacements();

    } catch (error) {
        message.style.color = "#fca5a5";
        message.textContent = error.message;
    }
});

// =====================================
// 5. CHECK EXISTING LOGIN SESSION
// =====================================

async function checkLoginSession() {

    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            showLoginScreen();
            return;
        }

        const user = await response.json();

        // The /me endpoint currently returns the student ID.
        // The name is shown after a fresh login.
        showDashboard("Student " + user.studentId);

        await loadPlacements();

    } catch (error) {
        console.error("Session check failed:", error);
        showLoginScreen();
    }
}

// =====================================
// 6. STUDENT LOGOUT
// =====================================

document.getElementById("logoutButton").addEventListener("click", async function() {

    try {
        const response = await fetch(`${AUTH_URL}/logout`, {
            method: "POST",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Could not log out.");
        }

        placements = [];

        document.getElementById("loginForm").reset();
        document.getElementById("loginMessage").textContent = "";

        document.getElementById("placementTable").innerHTML =
            '<tr><td colspan="7">Please log in to view placements.</td></tr>';

        showLoginScreen();

        alert("Logged out successfully!");

    } catch (error) {
        alert(error.message);
    }
});

// =====================================
// 7. LOAD STUDENT PLACEMENTS
// =====================================

async function loadPlacements() {

    try {
        const response = await fetch(API_URL, {
            credentials: "same-origin"
        });

        if (response.status === 401) {
            showLoginScreen();
            return;
        }

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        placements = await response.json();

        displayPlacements(placements);
        updateStatistics();

    } catch (error) {
        console.error("Error:", error);

        document.getElementById("placementTable").innerHTML =
            '<tr><td colspan="7">Unable to load placements.</td></tr>';
    }
}

// =====================================
// 8. DISPLAY PLACEMENTS
// =====================================

function displayPlacements(data) {

    const table = document.getElementById("placementTable");
    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML =
            '<tr><td colspan="7">No placements found.</td></tr>';
        return;
    }

    data.forEach(placement => {

        const row = document.createElement("tr");

        const status = String(placement.status || "");
        const normalizedStatus = status.toLowerCase();

        const statusClass = {
            applied: "status-applied",
            interview: "status-interview",
            selected: "status-selected",
            rejected: "status-rejected"
        }[normalizedStatus] || "";

        row.innerHTML = `
            <td>${placement.id}</td>
            <td>${escapeHTML(placement.companyName)}</td>
            <td>${escapeHTML(placement.role)}</td>
            <td>${escapeHTML(placement.location)}</td>
            <td>${escapeHTML(placement.applicationDate)}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHTML(status)}
                </span>
            </td>
            <td>
                <button class="edit-btn"
                    onclick="editPlacement(${placement.id})">Edit</button>

                <button class="delete-btn"
                    onclick="deletePlacement(${placement.id})">Delete</button>
            </td>
        `;

        table.appendChild(row);
    });
}

// =====================================
// 9. ESCAPE DATABASE TEXT
// =====================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// =====================================
// 10. DASHBOARD STATISTICS
// =====================================

function updateStatistics() {

    const total = placements.length;

    const applied = placements.filter(
        p => p.status.toLowerCase() === "applied"
    ).length;

    const interview = placements.filter(
        p => p.status.toLowerCase() === "interview"
    ).length;

    const selected = placements.filter(
        p => p.status.toLowerCase() === "selected"
    ).length;

    const rejected = placements.filter(
        p => p.status.toLowerCase() === "rejected"
    ).length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("appliedCount").textContent = applied;
    document.getElementById("interviewCount").textContent = interview;
    document.getElementById("selectedCount").textContent = selected;
    document.getElementById("rejectedCount").textContent = rejected;

    const getPercentage = value => {
        return total === 0 ? 0 : Math.round((value / total) * 100);
    };

    const appliedPercent = getPercentage(applied);
    const interviewPercent = getPercentage(interview);
    const selectedPercent = getPercentage(selected);
    const rejectedPercent = getPercentage(rejected);

    document.getElementById("appliedBar").style.width = appliedPercent + "%";
    document.getElementById("interviewBar").style.width = interviewPercent + "%";
    document.getElementById("selectedBar").style.width = selectedPercent + "%";
    document.getElementById("rejectedBar").style.width = rejectedPercent + "%";

    document.getElementById("appliedPercentage").textContent = appliedPercent + "%";
    document.getElementById("interviewPercentage").textContent = interviewPercent + "%";
    document.getElementById("selectedPercentage").textContent = selectedPercent + "%";
    document.getElementById("rejectedPercentage").textContent = rejectedPercent + "%";

    document.getElementById("selectionRate").textContent =
        getPercentage(selected) + "%";

    document.getElementById("interviewRate").textContent =
        getPercentage(interview) + "%";
}

// =====================================
// 11. ADD PLACEMENT
// =====================================

document.getElementById("placementForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const newPlacement = {
        companyName: document.getElementById("companyName").value.trim(),
        role: document.getElementById("role").value.trim(),
        location: document.getElementById("location").value.trim(),
        applicationDate: document.getElementById("applicationDate").value,
        status: document.getElementById("status").value
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newPlacement)
        });

        if (response.status === 401) {
            showLoginScreen();
            return;
        }

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        alert("Placement added successfully!");

        this.reset();

        await loadPlacements();

    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
});

// =====================================
// 12. DELETE PLACEMENT
// =====================================

async function deletePlacement(id) {

    if (!confirm("Are you sure you want to delete this placement?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            credentials: "same-origin"
        });

        if (response.status === 401) {
            showLoginScreen();
            return;
        }

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        alert("Placement deleted successfully!");

        await loadPlacements();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// =====================================
// 13. EDIT PLACEMENT
// =====================================

function editPlacement(id) {

    const placement = placements.find(p => p.id === id);

    if (!placement) {
        alert("Placement not found!");
        return;
    }

    document.getElementById("editId").value = placement.id;
    document.getElementById("editCompanyName").value = placement.companyName;
    document.getElementById("editRole").value = placement.role;
    document.getElementById("editLocation").value = placement.location;
    document.getElementById("editApplicationDate").value =
        placement.applicationDate;

    document.getElementById("editStatus").value =
        placement.status.charAt(0).toUpperCase() +
        placement.status.slice(1).toLowerCase();

    document.getElementById("editSection").style.display = "block";

    document.getElementById("editSection").scrollIntoView({
        behavior: "smooth"
    });
}

// =====================================
// 14. UPDATE PLACEMENT
// =====================================

document.getElementById("editPlacementForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const id = document.getElementById("editId").value;

    const updatedPlacement = {
        companyName: document.getElementById("editCompanyName").value.trim(),
        role: document.getElementById("editRole").value.trim(),
        location: document.getElementById("editLocation").value.trim(),
        applicationDate: document.getElementById("editApplicationDate").value,
        status: document.getElementById("editStatus").value
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedPlacement)
        });

        if (response.status === 401) {
            showLoginScreen();
            return;
        }

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        alert("Placement updated successfully!");

        document.getElementById("editSection").style.display = "none";

        await loadPlacements();

    } catch (error) {
        console.error("Update error:", error);
        alert(error.message);
    }
});

// Cancel Edit
document.getElementById("cancelEdit").addEventListener("click", function() {
    document.getElementById("editSection").style.display = "none";
});

// =====================================
// 15. SEARCH AND FILTER
// =====================================

function filterPlacements() {

    const searchValue =
        document.getElementById("searchInput").value.toLowerCase();

    const selectedStatus =
        document.getElementById("statusFilter").value.toLowerCase();

    const filtered = placements.filter(p => {

        const matchesCompany =
            p.companyName.toLowerCase().includes(searchValue);

        const matchesStatus =
            !selectedStatus ||
            p.status.toLowerCase() === selectedStatus;

        return matchesCompany && matchesStatus;
    });

    displayPlacements(filtered);
}

document.getElementById("searchInput").addEventListener("input", filterPlacements);

document.getElementById("statusFilter").addEventListener("change", filterPlacements);

// =====================================
// 16. START APPLICATION
// =====================================

// Check whether a valid login session already exists.
checkLoginSession();
