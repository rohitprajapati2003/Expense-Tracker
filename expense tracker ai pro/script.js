let currentUser = localStorage.getItem("currentUser");

const loginScreen = document.getElementById("login-screen");
const app = document.getElementById("app");

if (currentUser) {
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");
}

function login() {
    const user = document.getElementById("username").value;
    if (!user) return alert("Enter username");
    localStorage.setItem("currentUser", user);
    location.reload();
}

function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

document.getElementById("dark-toggle").onclick = () => {
    document.body.classList.toggle("dark");
};

let expenses = JSON.parse(localStorage.getItem("expenses_" + currentUser)) || [];
let totalAmount = 0;
let points = 0;

const tableBody = document.getElementById("expense-table-body");
const totalCell = document.getElementById("total-amount");
const pointsCell = document.getElementById("points");
const budgetInput = document.getElementById("budget-input");
const remainingBudget = document.getElementById("remaining-budget");

budgetInput.value = localStorage.getItem("budget_" + currentUser) || 0;

budgetInput.oninput = () => {
    localStorage.setItem("budget_" + currentUser, budgetInput.value);
    updateBudget();
};

const categorySelect = document.getElementById("category-select");
const customCategory = document.getElementById("custom-category");
customCategory.style.display = "none";

categorySelect.onchange = () => {
    customCategory.style.display =
        categorySelect.value === "custom" ? "block" : "none";
};

let pieChart, barChart;
const pieCtx = document.getElementById("pieChart");
const barCtx = document.getElementById("barChart");

document.getElementById("add-btn").onclick = () => {
    const category =
        categorySelect.value === "custom"
            ? customCategory.value
            : categorySelect.value;

    const amount = Number(document.getElementById("amount-input").value);
    const date = document.getElementById("date-input").value;

    if (!category || amount <= 0 || !date) {
        alert("Fill all fields");
        return;
    }

    expenses.push({ category, amount, date });
    localStorage.setItem("expenses_" + currentUser, JSON.stringify(expenses));
    render();
};

function render() {
    tableBody.innerHTML = "";
    totalAmount = 0;

    expenses.forEach((e, i) => {
        totalAmount += e.amount;

        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${e.category}</td>
            <td>${e.amount}</td>
            <td>${e.date}</td>
            <td><button class="delete-btn">Delete</button></td>
        `;

        row.querySelector("button").onclick = () => {
            expenses.splice(i, 1);
            localStorage.setItem("expenses_" + currentUser, JSON.stringify(expenses));
            render();
        };
    });

    totalCell.textContent = totalAmount;
    points += 5;
    pointsCell.textContent = points;

    updateBudget();
    updateCharts();
}

function updateBudget() {
    const budget = Number(budgetInput.value);
    const remaining = budget - totalAmount;
    remainingBudget.textContent = remaining;
    remainingBudget.className = remaining < 0 ? "warning" : "";
}

function updateCharts() {
    const map = {};
    expenses.forEach(e => {
        map[e.category] = (map[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(map);
    const data = Object.values(map);

    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();

    pieChart = new Chart(pieCtx, {
        type: "pie",
        data: { labels, datasets: [{ data }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    barChart = new Chart(barCtx, {
        type: "bar",
        data: { labels, datasets: [{ data }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function exportCSV() {
    let csv = "Category,Amount,Date\n";
    expenses.forEach(e => {
        csv += `${e.category},${e.amount},${e.date}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expenses.csv";
    link.click();
}

function predictExpense() {
    if (expenses.length < 2) {
        document.getElementById("prediction").textContent =
            "Not enough data to predict.";
        return;
    }

    const sorted = [...expenses].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);

    const diffDays =
        Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) || 1;

    let total = 0;
    expenses.forEach(e => total += e.amount);

    const dailyAvg = total / diffDays;
    const monthlyPrediction = Math.round(dailyAvg * 30);

    document.getElementById("prediction").textContent =
        `🤖 AI predicts approx ₹${monthlyPrediction} next month`;
}

render();