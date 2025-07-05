const passwordInput = document.getElementById('password');
const strengthDisplay = document.getElementById('strength');
const timeToCrackDisplay = document.getElementById('timeToCrack');
const breachWarning = document.getElementById('breachWarning');
const breachCount = document.getElementById('breachCount');
const progressBar = document.getElementById('progressBar');
const togglePassword = document.getElementById('togglePassword');

const rules = {
    length: document.querySelector("#lengthRule .icon"),
    upper: document.querySelector("#upperRule .icon"),
    lower: document.querySelector("#lowerRule .icon"),
    number: document.querySelector("#numberRule .icon"),
    symbol: document.querySelector("#symbolRule .icon")
};

passwordInput.addEventListener('input', async () => {
    const password = passwordInput.value;
    const strength = calculateStrength(password);
    strengthDisplay.textContent = `Strength: ${strength.label}`;
    strengthDisplay.style.color = strength.color;

    // Progress bar
    let percent = 0;
    let barColor = "red";
    let glow = "0 0 10px rgba(255, 0, 0, 0.6)";

    if (strength.label === "Weak") {
        percent = 25;
        barColor = "red";
        glow = "0 0 10px rgba(255, 0, 0, 0.6)";
    } else if (strength.label === "Moderate") {
        percent = 50;
        barColor = "orange";
        glow = "0 0 10px rgba(255, 165, 0, 0.6)";
    } else if (strength.label === "Strong") {
        percent = 75;
        barColor = "limegreen";
        glow = "0 0 10px rgba(50, 205, 50, 0.6)";
    } else if (strength.label === "Very Strong") {
        percent = 100;
        barColor = "cyan";
        glow = "0 0 10px rgba(0, 255, 255, 0.6)";
    }

    progressBar.style.width = percent + "%";
    progressBar.style.background = barColor;
    progressBar.style.boxShadow = glow;

    timeToCrackDisplay.textContent = `Time to Crack: ${strength.crackTime}`;

    // Live checklist
    updateRule(rules.length, password.length >= 12);
    updateRule(rules.upper, /[A-Z]/.test(password));
    updateRule(rules.lower, /[a-z]/.test(password));
    updateRule(rules.number, /[0-9]/.test(password));
    updateRule(rules.symbol, /[^a-zA-Z0-9]/.test(password));

    // Breach check
    if (password.length > 5) {
        const hash = await sha1(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5).toUpperCase();

        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await res.text();

        const lines = text.split('\n');
        const match = lines.find(line => line.split(':')[0].trim().toUpperCase() === suffix);

        if (match) {
            const count = match.split(':')[1].trim();
            breachWarning.textContent = "⚠️ This password has been found in a data breach!";
            breachCount.textContent = `Appeared in ${count} known breaches.`;
        } else {
            breachWarning.textContent = "";
            breachCount.textContent = "";
        }
    } else {
        breachWarning.textContent = "";
        breachCount.textContent = "";
    }
});

function updateRule(iconElement, passed) {
    iconElement.textContent = passed ? "✅" : "❌";
    iconElement.classList.toggle("good", passed);
}

togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
});

function calculateStrength(password) {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    const entropy = password.length * Math.log2(charsetSize);

    if (entropy < 30) return { label: "Weak", color: "red", crackTime: "Instantly" };
    if (entropy < 50) return { label: "Moderate", color: "orange", crackTime: "A few seconds" };
    if (entropy < 70) return { label: "Strong", color: "limegreen", crackTime: "A few months" };
    return { label: "Very Strong", color: "cyan", crackTime: "Centuries" };
}

async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest("SHA-1", buffer);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
