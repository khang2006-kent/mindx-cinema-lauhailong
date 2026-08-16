function showMessage(text, type) {
  const box = document.getElementById('formMessage');
  if (!box) return;
  box.textContent = text;
  box.className = `form-message ${type}`;
}

function getUsers() {
  const raw = localStorage.getItem('users');
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function initRegister() {
  const registerBtn = document.getElementById('registerBtn');
  registerBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !email || !password) {
      showMessage('(!) Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('(!) Mật khẩu phải có ít nhất 6 ký tự.', 'error');
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.email === email);
    if (exists) {
      showMessage('(!) Email này đã được đăng ký. Vui lòng thử email khác.', 'error');
      return;
    }

    users.push({ username, email, password });
    saveUsers(users);
    showMessage('Đăng ký thành công. Đang chuyển sang trang đăng nhập...', 'success');
    setTimeout(() => {
      window.location.href = 'login.html?registered=1';
    }, 800);
  });
}

window.addEventListener('DOMContentLoaded', initRegister);
