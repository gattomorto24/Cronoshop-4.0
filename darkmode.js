const topActionButtons = Array.from(document.querySelectorAll('.top-action, .desktop-theme-btn'));
const body = document.body;

function updateThemeIcon(isDark) {
  topActionButtons.forEach(button => {
    const icon = button.querySelector('.top-action-icon');
    if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  });
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark-mode', isDark);
  body.classList.toggle('dark-mode', isDark);
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = !body.classList.contains('dark-mode');
  setTheme(isDark ? 'dark' : 'light');
  localStorage.setItem('cronoshop-theme', isDark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('cronoshop-theme');
setTheme(savedTheme === 'dark' ? 'dark' : 'light');

topActionButtons.forEach(button => button.addEventListener('click', toggleTheme));
