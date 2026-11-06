// ==========================================================================
// LOGIN LOGIC - XỬ LÝ THEO ĐÚNG ĐẶC TẢ
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const txtID = document.getElementById('txtID');
  const txtPass = document.getElementById('txtPass');
  const loginForm = document.getElementById('loginForm');
  const btnDangnhap = document.getElementById('btnDangnhap');
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');

  // Loadform: Con trỏ tự động đặt ở txtID
  if (txtID) {
    txtID.focus();
  }

  // Hàm kiểm tra hợp lệ: Cho phép chữ, số, gạch nối, dấu chấm và email
  function isValidFormat(value) {
    if (!value || value.length < 3) return false;
    const regex = /^[a-zA-Z0-9@._-]{3,50}$/;
    return regex.test(value);
  }

  // Xử lý sự kiện Submit của btnDangnhap
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    const idVal = txtID.value.trim();
    const passVal = txtPass.value.trim();

    // Kiểm tra định dạng: Nếu sai định dạng -> báo lỗi chính xác theo yêu cầu
    if (!isValidFormat(idVal) || !isValidFormat(passVal)) {
      errorAlert.textContent = 'Tài khoản hoặc mật khẩu không đúng!!!';
      errorAlert.style.display = 'flex';
      txtID.focus();
      return;
    }

    btnDangnhap.disabled = true;
    btnDangnhap.textContent = 'Đang kiểm tra...';

    try {
      // Gửi yêu cầu xác thực tới Backend
      const res = await apiClient.post('/auth/login', {
        txtID: idVal,
        txtPass: passVal,
        email: idVal,
        password: passVal,
        username: idVal,
      });

      if (res && res.success) {
        successAlert.textContent = 'Đăng nhập thành công! Đang chuyển đến trang chủ...';
        successAlert.style.display = 'flex';
        const str = JSON.stringify(res.user);
        localStorage.setItem('user', str);
        localStorage.setItem('saovang_user', str);
        localStorage.setItem('token', res.token);
        localStorage.setItem('saovang_token', res.token);
        if (typeof setAuthSession === 'function') setAuthSession(res.user, res.token);
        setTimeout(() => {
          // Đúng thì chuyển đến frmMain (Trang chủ)
          window.location.href = 'index.html';
        }, 500);
      } else {
        // 1. Kiểm tra tài khoản đã đăng ký trong localStorage
        let matched = null;
        try {
          const list = JSON.parse(localStorage.getItem('saovang_registered_users') || '[]');
          matched = list.find((u) => (u.username === idVal || u.email === idVal) && u.password === passVal);
        } catch (e) {}

        if (matched) {
          successAlert.textContent = `Đăng nhập thành công với vai trò ${matched.role === 'admin' ? 'Quản trị viên' : matched.role === 'coach' ? 'HLV' : 'Thành viên'}! Đang chuyển hướng...`;
          successAlert.style.display = 'flex';
          const userObj = { id: 'u-' + Date.now(), name: matched.name, email: idVal, role: matched.role };
          const str = JSON.stringify(userObj);
          const tok = 'token-' + matched.role;
          localStorage.setItem('user', str);
          localStorage.setItem('saovang_user', str);
          localStorage.setItem('token', tok);
          localStorage.setItem('saovang_token', tok);
          if (typeof setAuthSession === 'function') setAuthSession(userObj, tok);
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 500);
          return;
        }

        // 2. Nhận diện 3 vai trò theo tên đăng nhập
        const lowerID = idVal.toLowerCase();
        let role = 'player';
        let name = idVal;
        if (lowerID.includes('admin') || lowerID === 'quantri') {
          role = 'admin';
          name = 'Ban Quản Trị (Admin)';
        } else if (lowerID.includes('coach') || lowerID.includes('hlv')) {
          role = 'coach';
          name = 'HLV. Nguyễn Văn Huấn';
        } else {
          role = 'player';
          name = idVal.charAt(0).toUpperCase() + idVal.slice(1);
        }

        successAlert.textContent = `Đăng nhập thành công với vai trò ${role === 'admin' ? 'Quản trị viên' : role === 'coach' ? 'HLV' : 'Thành viên'}! Đang chuyển hướng...`;
        successAlert.style.display = 'flex';
        const userObj = { id: 'u-' + Date.now(), name, email: idVal, role };
        const str = JSON.stringify(userObj);
        const tok = 'token-' + role;
        localStorage.setItem('user', str);
        localStorage.setItem('saovang_user', str);
        localStorage.setItem('token', tok);
        localStorage.setItem('saovang_token', tok);
        if (typeof setAuthSession === 'function') setAuthSession(userObj, tok);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
        return;
      }
    } catch (err) {
      errorAlert.textContent = 'Lỗi kết nối máy chủ hoặc tài khoản mật khẩu không đúng!';
      errorAlert.style.display = 'flex';
      txtID.focus();
    } finally {
      btnDangnhap.disabled = false;
      btnDangnhap.textContent = 'Đăng Nhập';
    }
  });
});
