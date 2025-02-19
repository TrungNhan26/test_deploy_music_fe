window.onload = async function () {
    const token = localStorage.getItem("authToken");
  
    if (token && isValidToken(token)) {
      try {
        const username = await getUserNameFromToken(token);
        localStorage.setItem("authUserName", username);
        console.log(username);
  
        await fetchUserInfo();
        await fetchMusic(token, username);
      } catch (error) {
        console.error("Lỗi khi lấy tên người dùng từ token:", error);
      }
    }
  };
  
  // Lấy username từ token
  async function getUserNameFromToken(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
  
      const decoded = JSON.parse(jsonPayload);
      const email = decoded.sub;
      const encodedEmail = encodeURIComponent(email);
  
      const response = await fetch(`http://localhost:8181/api/user/${encodedEmail}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Không thể lấy thông tin người dùng từ API.");
      }
  
      const data = await response.json();
      return data.data?.userNameResponse || "No name";
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error);
      return "No username";
    }
  }

  function downloadMusic(titleResponse) {
    fetch(`http://localhost:8000/results/${titleResponse}`)
      .then(response => {
          if (!response.ok) {
              throw new Error("File not found");
          }
          return response.blob();
      })
      .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = titleResponse + ".midi";; // Đổi tên file theo nhu cầu
          document.body.appendChild(a);
          a.click();
          a.remove();
      })
      .catch(error => console.error("Download failed:", error));
  }

  
  // Gọi API để lấy danh sách bài hát của người dùng
  async function fetchMusic(token, username) {
    const musicList = document.getElementById("music-list");
  
    if (!musicList) {
      console.error("Element with ID 'music-list' not found!");
      return;
    }
  
    // Xóa nội dung cũ trước khi thêm mới
    musicList.innerHTML = "";
  
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
      const musicItems = data.data?.items || [];
  
      if (musicItems.length === 0) {
        musicList.innerHTML = `
          <tr>
            <td colspan="4" class="text-center">No music found.</td>
          </tr>`;
        return;
      }
  
      musicItems.forEach((song) => {
        const row = `
          <tr>
            <td>${song.musicIdResponse || "Unknown"}</td>
            <td>${song.titleResponse || "Unknown Title"}</td>
            <td>${song.categoryIdResponse === 1 ? 'Monotone' : song.categoryIdResponse === 2 ? 'Multitone' : 'Unknown'} </td>
            <td>
              <span class="payment-status ${song.purchasedResponse ? "paid" : "unpaid"}">
                ${song.purchasedResponse ? "Paid" : "Unpaid"}
              </span>
            </td>
            <td>
              ${song.purchasedResponse 
                ? `<button class="btn btn-primary" onclick="downloadMusic('${song.titleResponse}')">Download</button>` 
                : `<a href="payment-page.html?musicId=${encodeURIComponent(song.musicIdResponse)}" 
                     class="btn btn-primary" style="background-color: red;">
                     Pay Now
                   </a>`}
            </td>
            <td>
              <button class="btn btn-warning" onclick="editMusicTitle('${song.musicIdResponse}', '${song.titleResponse}')">
                Edit
              </button>
            </td>
          </tr>`;
        
        musicList.innerHTML += row;
    });
  
    } catch (error) {
      console.error("Error fetching music data:", error.message);
      alert("Failed to load music data. Please try again later.");
    }
  }
  
  // Kiểm tra token hợp lệ (giả sử có sẵn hàm này)
  function isValidToken(token) {
    // Logic kiểm tra token hợp lệ
    return token && token.split(".").length === 3;
  }

  async function fetchUserInfo() {
    const userInfo = document.getElementById('user-info');
    userInfo.innerHTML = ''; // Clear existing content
  
    try {
      const token = localStorage.getItem('authToken'); // Lấy token từ localStorage
      if (!token) {
        throw new Error('No authentication token found');
      }
  
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
      const email = decoded.sub; // Email lấy từ payload của token
  
      // Mã hóa email để an toàn khi gửi qua URL
      const encodedEmail = encodeURIComponent(email);
  
      // Fetch user data từ API với email đã mã hóa
      const response = await fetch(`http://localhost:8181/api/user/${encodedEmail}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Gửi token qua header
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch user info.');
      }
  
      const result = await response.json();
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to fetch data');
      }
  
      const data = result.data; // Truy cập phần tử 'data' trong phản hồi
  
      // Giả sử dữ liệu trả về có cấu trúc như UserResponseDTO
      const userNameResponse = data.userNameResponse || 'N/A';
      const emailResponse = data.emailResponse || 'N/A';
      const fullNameResponse = data.fullNameResponse || 'N/A';
      const phoneNumberResponse = data.phoneNumberResponse || 'N/A';
  
      // Cập nhật UI với dữ liệu người dùng
      const userInfoSection = `
        <h3>User Information</h3>
        <p><strong>Username:</strong> ${userNameResponse}</p>
        <p><strong>Email:</strong> ${emailResponse}</p>
        <p><strong>Full Name:</strong> ${fullNameResponse}</p>
        <p><strong>Phone Number:</strong> ${phoneNumberResponse}</p>
        <button onclick="window.location.href='home.html'" class="btn btn-secondary">Back to Home</button>
      `;
      
      userInfo.innerHTML = userInfoSection;
  
    } catch (error) {
      console.error('Error fetching user info:', error);
      alert('Could not load user information. Please try again.');
    }
  }
  
  function searchMusic() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const musicList = document.getElementById("music-list");
    const rows = musicList.getElementsByTagName("tr");
  
    for (let i = 0; i < rows.length; i++) {
      const titleCell = rows[i].getElementsByTagName("td")[1]; // Cột chứa tên bài hát
      if (titleCell) {
        const titleText = titleCell.textContent || titleCell.innerText;
        if (titleText.toLowerCase().includes(searchInput)) {
          rows[i].style.display = ""; // Hiển thị dòng nếu khớp
        } else {
          rows[i].style.display = "none"; // Ẩn dòng nếu không khớp
        }
      }
    }
  }

  let editingMusicId = null;

function editMusicTitle(musicId, currentTitle) {
  editingMusicId = musicId;
  document.getElementById("newTitle").value = currentTitle;
  document.getElementById("editModal").style.display = "block";
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
}

async function saveMusicTitle() {
  const newTitle = document.getElementById("newTitle").value;
  if (!newTitle.trim()) {
    alert("Title cannot be empty!");
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:8000/api/music/${editingMusicId}/update-title`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_title: newTitle }),
    });

    if (!response.ok) {
      throw new Error("Failed to update music title.");
    }

    alert("Music title updated successfully!");
    closeModal();
  } catch (error) {
    console.error("Error updating music title:", error);
    alert("Error updating music title.");
  }
  fetchMusic(localStorage.getItem("authToken"), localStorage.getItem("authUserName"));
}

  
  
  
  