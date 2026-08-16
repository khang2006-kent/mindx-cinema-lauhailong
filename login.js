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

function setLoggedInUser(user) {
  localStorage.setItem('authUser', JSON.stringify(user));
  localStorage.setItem('isLoggedIn', 'true');
}

function initLogin() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1') {
    showMessage('Đăng ký thành công. Vui lòng đăng nhập.', 'success');
  }

  const loginBtn = document.getElementById('loginBtn');
  loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      showMessage('(!) Vui lòng nhập đầy đủ thông tin để đăng nhập.', 'error');
      return;
    }

    const users = getUsers();
    const match = users.find((user) => user.email === email && user.password === password);

    if (match) {
      setLoggedInUser({ username: match.username, email: match.email });
      showMessage('Đăng nhập thành công. Đang chuyển tới trang chủ...', 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 700);
    } else {
      showMessage('(!) Email hoặc mật khẩu không đúng. Vui lòng thử lại.', 'error');
    }
  });
}

window.addEventListener('DOMContentLoaded', initLogin);
