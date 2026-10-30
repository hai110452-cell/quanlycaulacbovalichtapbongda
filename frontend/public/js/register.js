// ==========================================================================
// REGISTER LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');
  const btnRegister = document.getElementById('btnRegister');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const role = document.getElementById('regRole').value;
    const password = document.getElementById('regPass').value;
    const confirmPassword = document.getElementById('regPassConfirm').value;

    if (password.length < 6) {
      errorAlert.textContent = 'Mật khẩu phải có độ dài từ 6 ký tự trở lên!';
      errorAlert.style.display = 'flex';
      return;
    }

    if (password !== confirmPassword) {
      errorAlert.textContent = 'Mật khẩu xác nhận không trùng khớp!';
      errorAlert.style.display = 'flex';
      return;
    }

    btnRegister.disabled = true;
    btnRegister.textContent = 'Đang xử lý...';

    try {
      const res = await apiClient.post('/auth/register', { name, email, role, password });
      if (res && res.success) {
        successAlert.textContent = 'Đăng ký tài khoản thành công! Đang chuyển hướng...';
        successAlert.style.display = 'flex';
        setAuthSession(res.user, res.token);
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 800);
        // Lưu tài khoản vào danh sách đã đăng ký
        try {
          const list = JSON.parse(localStorage.getItem('saovang_registered_users') || '[]');
          list.push({ username: email, email, password, name, role });
          localStorage.setItem('saovang_registered_users', JSON.stringify(list));
        } catch (e) {}

        const userObj = { id: 'u-' + Date.now(), name, email, role };
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('token', 'token-' + role);
        if (typeof setAuthSession === 'function') {
          setAuthSession(userObj, 'token-' + role);
        }

        successAlert.textContent = 'Đăng ký tài khoản thành công! Đang chuyển hướng...';
        successAlert.style.display = 'flex';
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 700);
    } catch (err) {
      errorAlert.textContent = 'Có lỗi xảy ra, vui lòng thử lại sau!';
      errorAlert.style.display = 'flex';
    } finally {
      btnRegister.disabled = false;
      btnRegister.textContent = 'Hoàn Tất Đăng Ký';
    }
  });
});
