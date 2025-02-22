let allMusics = []; // Biến toàn cục lưu danh sách âm nhạc

// Hàm fetch dữ liệu âm nhạc
function fetchMusics() {
    // Lấy token từ localStorage
    const token = localStorage.getItem('authToken');
    console.log({ token });

    // Kiểm tra xem token có tồn tại hay không
    if (!token) {
        alert('Bạn phải đăng nhập để truy cập trang này.');
        window.location.href = '/login.html'; // Chuyển hướng về trang login nếu không có token
    } else {
        // Cấu hình yêu cầu
        const requestOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        // Gửi yêu cầu xác thực token và lấy dữ liệu âm nhạc
        fetch('http://27.71.20.51:8181/api/admin/musics', requestOptions)
            .then((response) => {
                if (!response.ok) {
                    // Nếu token không hợp lệ, chuyển hướng về trang đăng nhập
                    alert('Token không hợp lệ hoặc lỗi xác thực.');
                    window.location.href = '/login.html';
                    throw new Error('Token không hợp lệ.');
                }
                return response.json(); // Trả về dữ liệu JSON nếu hợp lệ
            })
            .then((responseData) => {
                if (responseData && responseData.data && responseData.data.items) {
                    allMusics = responseData.data.items; // Lưu trữ toàn bộ danh sách âm nhạc
                    displayMusics(allMusics); // Hiển thị tất cả âm nhạc
                } else {
                    console.error('Dữ liệu không hợp lệ hoặc thiếu thông tin.');
                }
            })
            .catch((error) => {
                console.error('Lỗi khi lấy dữ liệu âm nhạc:', error);
            });
    }
}

// Hàm hiển thị âm nhạc
function displayMusics(musics) {
    const musicTableBody = document.querySelector("#musicTableBody");
    musicTableBody.innerHTML = ''; // Xóa nội dung bảng trước khi thêm dữ liệu mới

    musics.forEach((track) => {
        // Tạo dòng mới trong bảng cho mỗi bản nhạc
        const row = `
            <tr>
                <td>${track.titleResponse || 'Chưa có tên'}</td>
                <td>${track.priceResponse || 'Chưa có giá'}</td>
                <td>${track.composerNameResponse || 'Chưa có thông tin'}</td>
                <td>${track.categoryIdResponse === 1 ? 'Monotone' : track.categoryIdResponse === 2 ? 'Multitone' : 'Chưa có thể loại'}</td>
                <td>${track.purchasedResponse ? 'Đã mua' : 'Chưa mua'}</td>
            </tr>`;
        musicTableBody.innerHTML += row;
    });
}

// Hàm tìm kiếm âm nhạc
function searchMusic() {
    const searchInput = document.getElementById('musicSearch').value.toLowerCase(); // Lấy giá trị tìm kiếm
    const filteredMusics = allMusics.filter((track) => {
        return (
            track.titleResponse.toLowerCase().includes(searchInput) || 
            track.composerNameResponse.toLowerCase().includes(searchInput) ||
            track.categoryIdResponse === 1 && 'Monotone'.toLowerCase().includes(searchInput) ||
            track.categoryIdResponse === 2 && 'Multitone'.toLowerCase().includes(searchInput)
        );
    });

    displayMusics(filteredMusics); // Hiển thị kết quả tìm kiếm
}
        
        // Hàm chuyển đổi giữa bảng người dùng và bảng âm nhạc
        function showTable(tableName) {
            const userTable = document.getElementById("userTable");
            const musicTable = document.getElementById("musicTable");
    
            if (tableName === 'user') {
                userTable.classList.remove("hidden");
                musicTable.classList.add("hidden");
                fetchUsers(); // Fetch user data khi chuyển sang tab User
            } else if (tableName === 'music') {
                musicTable.classList.remove("hidden");
                userTable.classList.add("hidden");
                //fetchMusic(); // Fetch music data khi chuyển sang tab Music
            }
        }

        let allUsers = []; // Biến toàn cục lưu danh sách người dùng

        function fetchUsers() {
            const token = localStorage.getItem('authToken'); // Lấy token từ localStorage
        
            // Kiểm tra token trước khi gửi yêu cầu
            if (!token) {
                alert('Bạn phải đăng nhập để truy cập trang này.');
                window.location.href = '/login.html'; // Chuyển hướng về trang đăng nhập nếu không có token
                return;
            }
        
            // Cấu hình yêu cầu
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };
        
            // Gửi yêu cầu đến API
            fetch('http://27.71.20.51:8181/api/admin/users', requestOptions)
                .then((response) => {
                    if (!response.ok) {
                        alert('Lỗi khi lấy danh sách người dùng hoặc token không hợp lệ.');
                        window.location.href = '/login.html'; // Chuyển hướng nếu xảy ra lỗi xác thực
                        throw new Error('Không thể lấy dữ liệu người dùng.');
                    }
                    return response.json(); // Trả về dữ liệu JSON
                })
                .then((responseData) => {
                    if (responseData && responseData.data && responseData.data.items) {
                        allUsers = responseData.data.items; // Lưu trữ toàn bộ danh sách người dùng
                        displayUsers(allUsers); // Hiển thị tất cả người dùng
                    } else {
                        console.error('Dữ liệu không hợp lệ hoặc thiếu thông tin.');
                        alert('Không tìm thấy người dùng nào.');
                    }
                })
                .catch((error) => {
                    console.error('Lỗi khi lấy dữ liệu người dùng:', error);
                    alert('Đã xảy ra lỗi trong quá trình tải dữ liệu.');
                });
        }
        
        // Hàm hiển thị người dùng
        function displayUsers(users) {
            const userTableBody = document.querySelector('#userTableBody');
            userTableBody.innerHTML = ''; // Xóa nội dung cũ trong bảng
        
            // Duyệt qua danh sách người dùng và thêm vào bảng
            users.forEach((user) => {
                const row = `
                    <tr>
                        <td>${user.userNameResponse || 'Không có tên người dùng'}</td>
                        <td>${user.emailResponse || 'Không có email'}</td>
                        <td>${user.fullNameResponse || 'Không có tên đầy đủ'}</td>
                        <td>${user.phoneNumberResponse || 'Không có số điện thoại'}</td>
                    </tr>`;
                userTableBody.innerHTML += row;
            });
        }
        
        // Hàm tìm kiếm người dùng
        function searchUsers() {
            const searchInput = document.getElementById('userSearch').value.toLowerCase(); // Lấy giá trị tìm kiếm
            const filteredUsers = allUsers.filter((user) => {
                return (
                    user.userNameResponse.toLowerCase().includes(searchInput) || 
                    user.emailResponse.toLowerCase().includes(searchInput) || 
                    user.fullNameResponse.toLowerCase().includes(searchInput) ||
                    user.phoneNumberResponse.toLowerCase().includes(searchInput)
                );
            });
        
            displayUsers(filteredUsers); // Hiển thị kết quả tìm kiếm
        }
        
        // Đảm bảo hàm fetchUsers đã được định nghĩa trước đó

        // Chạy hàm fetchUsers khi trang tải
        window.onload = function () {
            fetchMusics();
            fetchUsers(); // Gọi hàm fetchUsers
            console.log('Trang đã tải và fetchUsers được gọi');
        };

        // Hàm đăng xuất
        function logout() {
            // Xóa token khỏi localStorage
            localStorage.removeItem('authToken');
    
            // Chuyển hướng về trang đăng nhập
            window.location.href = '/Login.html';
        }

        
        