let currentTab = 'monotone';  // Default tab
  // Function to switch between tabs
  function switchTab(tab) {
    currentTab = tab;
    resetForm(); // Reset form và trạng thái toggle
    // Đảm bảo các trường MIDI upload bị ẩn khi chuyển tab
    document.getElementById(`${tab}Toggle`).checked = false;
    toggleMidiUpload(tab);
  }

  function toggleMidiUpload(tab) {
    const toggle = document.getElementById(`${tab}Toggle`);
    const midiFile = document.getElementById(`${tab}MidiFile`);
    const midiInput = document.getElementById(`${tab}Midi`);

    if (toggle.checked) {
        midiFile.style.display = 'block';  // Hiển thị trường upload MIDI
        midiInput.disabled = false;       // Kích hoạt input MIDI
    } else {
        midiFile.style.display = 'none';  // Ẩn trường upload MIDI
        midiInput.disabled = true;        // Vô hiệu hóa input MIDI
        midiInput.value = '';             // Đặt lại giá trị file input
    }
  }

  function resetForm() {
    // Đặt lại các trường đầu vào (nếu có)
    document.querySelectorAll('input[type="text"], input[type="file"]').forEach(input => {
        input.value = '';
    });

    // Đặt lại trạng thái toggle MIDI
    ['monotone', 'multitone'].forEach(tab => {
        const toggle = document.getElementById(`${tab}Toggle`);
        const midiFile = document.getElementById(`${tab}MidiFile`);
        const midiInput = document.getElementById(`${tab}Midi`);

        toggle.checked = false;
        midiFile.style.display = 'none';
        midiInput.disabled = true;
        midiInput.value = '';
    });
}

  
window.onload = async function () {
  const token = localStorage.getItem("authToken");

  if (token && isValidToken(token)) {
    try {
      const fullName = await getFullNameFromToken(token);
      const username = await getUserNameFromToken(token);
      localStorage.setItem('authUserName', username);
      const loginLink = document.getElementById("login-link");
      const userMenu = document.getElementById("user-menu");

      // Cập nhật giao diện
      loginLink.innerHTML = `Hello, ${fullName}`;
      loginLink.href = "#";
      userMenu.style.display = "none"; // Ẩn menu mặc định

      // Thêm sự kiện toggle menu
      loginLink.addEventListener("click", function (e) {
        e.preventDefault(); // Ngăn điều hướng mặc định
        userMenu.style.display =
          userMenu.style.display === "none" ? "block" : "none"; // Toggle menu
      });

      // Xử lý sự kiện Logout
      document.getElementById("logout-button").addEventListener("click", function () {
        localStorage.removeItem("authToken");
        window.location.href = "home.html";
      });

      // Lấy danh sách bài hát của người dùng từ API
      await fetchPurchasedMusic(token,username);
      
    } catch (error) {
      console.error("Lỗi khi lấy tên người dùng từ token:", error);
    }
  }
};

// Kiểm tra token
function isValidToken(token) {
  return token.length > 0;
}

// Lấy fullname từ token
async function getFullNameFromToken(token) {
  try {
    // Giải mã payload từ token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('') 
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    const email = decoded.sub;

    // Mã hóa email để an toàn khi gửi qua URL
    const encodedEmail = encodeURIComponent(email);

    // Gửi request với token trong header
    const response = await fetch(`http://localhost:8181/api/user/${encodedEmail}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`, // Thêm token vào header Authorization
        'Content-Type': 'application/json', // Đặt Content-Type nếu cần
      },
    });

    if (!response.ok) {
      throw new Error("Không thể lấy thông tin người dùng từ API.");
    }

    const data = await response.json();
    return data.data?.fullNameResponse || "User"; // Trả về tên đầy đủ hoặc "User" nếu không tìm thấy
  } catch (error) {
    console.error("Lỗi khi giải mã token:", error);
    return "User"; // Trả về mặc định khi có lỗi
  }
}

// Lấy username từ token
async function getUserNameFromToken(token) {
  try {
    // Giải mã payload từ token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('') 
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    const email = decoded.sub;

    // Mã hóa email để an toàn khi gửi qua URL
    const encodedEmail = encodeURIComponent(email);

    // Gửi request với token trong header
    const response = await fetch(`http://localhost:8181/api/user/${encodedEmail}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`, // Thêm token vào header Authorization
        'Content-Type': 'application/json', // Đặt Content-Type nếu cần
      },
    });

    if (!response.ok) {
      throw new Error("Không thể lấy thông tin người dùng từ API.");
    }

    const data = await response.json();
    return data.data?.userNameResponse || "no name"; // Trả về tên đầy đủ hoặc "User" nếu không tìm thấy
  } catch (error) {
    console.error("Lỗi khi giải mã token:", error);
    return "No username"; // Trả về mặc định khi có lỗi
  }
}


// Hàm lấy danh sách bài hát đã mua
async function fetchPurchasedMusic(token, username) {
  const purchasedMusicList = document.getElementById("purchased-music-list");

  if (!purchasedMusicList) {
    console.error("Element with ID 'purchased-music-list' not found!");
    return;
  }

  purchasedMusicList.innerHTML = "";

  try {
    const url = `http://localhost:8181/api/user/musics/my-musics?composerUserName=${encodeURIComponent(
      username
    )}&page=1&pageSize=10`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const purchasedItems = (data.data?.items || []).filter(
      (song) => song.purchasedResponse
    );

    if (purchasedItems.length === 0) {
      purchasedMusicList.innerHTML =
        "<p class='text-center'>No purchased music found.</p>";
      return;
    }

    purchasedItems.forEach((song) => {
      const card = `
        <div class="col-md-4 col-lg-3 mb-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">${song.titleResponse || "Unknown Title"}</h5>
              <p class="card-text">Category: ${song.categoryIdResponse === 1 ? 'Monotone' : song.categoryIdResponse === 2 ? 'Multitone' : 'Unknown'}</p>
              <a href="detail.html?musicId=${encodeURIComponent(song.musicIdResponse)}"
                class="btn btn-primary">
                Listen
              </a>
            </div>
          </div>
        </div>
      `;
      purchasedMusicList.innerHTML += card;
    });
  } catch (error) {
    console.error("Error fetching purchased music data:", error.message);
    alert("Failed to load purchased music data. Please try again later.");
  }
}

document.getElementById('openModalButton').addEventListener('click', function () {
  checkTokenBeforeOpeningModal();
});

// Kiểm tra token trong localStorage và mở modal nếu có token hợp lệ
function checkTokenBeforeOpeningModal() {
  const token = localStorage.getItem('authToken'); // Lấy token từ localStorage (hoặc cookie)
  
  if (token && isValidToken(token)) {
    // Nếu có token hợp lệ, mở modal
    const myModal = new bootstrap.Modal(document.getElementById('createMusicModal'));
    myModal.show();
  } else {
    // Nếu không có token hoặc token không hợp lệ, chuyển hướng người dùng đến trang login
    window.location.href = '/Login.html'; // Thay đổi URL đến trang đăng nhập của bạn
  }
}

// Kiểm tra token hợp lệ (ở đây chỉ kiểm tra độ dài token, bạn có thể thay đổi theo yêu cầu)
function isValidToken(token) {
  return token.length > 0; // Thay đổi phương thức kiểm tra token nếu cần
}

// Handle Create Music button click
async function handleCreateMusic() {
  const isMidiUploadedMonotone = document.getElementById('monotoneToggle').checked && document.getElementById('monotoneMidi').files.length > 0;
  const isMidiUploadedMultitone = document.getElementById('multitoneToggle').checked && document.getElementById('multitoneMidi').files.length > 0;

  // Disable the Create Music button and show loading spinner
  const createMusicBtn = document.getElementById('createMusicBtn');
  const processingMessage = document.getElementById('processingMessage');
  createMusicBtn.disabled = true;
  processingMessage.style.display = 'block';

  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('authUserName');

  try {
    let apiUrl = '';
    let categoryId = 0;
    let midiFile = null;

    if (currentTab === 'monotone') {
      categoryId = 1;
      if (isMidiUploadedMonotone) {
        apiUrl = 'http://27.71.20.51:8000/roll-gen-melody-with-midi-monotone';
        midiFile = document.getElementById('monotoneMidi').files[0];
      } else if (!document.getElementById('monotoneToggle').checked) {
        apiUrl = 'http://27.71.20.51:8000/roll-gen-melody-without-midi-monotone';
      }
    } else if (currentTab === 'multitone') {
      categoryId = 2;
      if (isMidiUploadedMultitone) {
        apiUrl = 'http://27.71.20.51:8000/nhan-gen-melody-with-midi-multitone';
        midiFile = document.getElementById('multitoneMidi').files[0];
      } else if (!document.getElementById('multitoneToggle').checked) {
        apiUrl = 'http://27.71.20.51:8000/hoang-gen-melody-without-midi-multitone';
      }
    }

    if (!apiUrl) {
      alert('Hãy chọn phương thức tạo nhạc trước khi tiếp tục.');
      return;
    }

    // Send request to Spring API
    const springResponse = await fetch('http://localhost:8181/api/user/musics/create-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        composerUserName: username,
        categoryId,
      }),
    });

    if (!springResponse.ok) {
      throw new Error('Có lỗi xảy ra khi lưu thông tin bài nhạc trong hệ thống.');
    }

    const formData = new FormData();
    formData.append('username', username);

    // 🔥 Chỉ append file nếu có
    if (midiFile) {
      formData.append('file', midiFile);
    }

    const fastApiResponse = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!fastApiResponse.ok) {
      throw new Error('Có lỗi xảy ra khi tạo nhạc từ FastAPI.');
    }

    // Redirect to profile page on success
    alert("Bạn cần thanh toán để nghe nhạc ở trang chủ hoặc tải về ở thông tin người dùng");
    window.location.href = 'user-profile.html';
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu:', error);
    alert(error.message);
  } finally {
    // Enable the Create Music button and hide the loading spinner
    createMusicBtn.disabled = false;
    processingMessage.style.display = 'none';
  }
}







