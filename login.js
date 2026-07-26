function login(){

    let email=document.getElementById("email").value;
    let password=document.getElementById("password").value;

    let user=JSON.parse(localStorage.getItem("user"));

    if(user==null){
        alert("Chưa có tài khoản.");
        return;
    }

    if(email==user.email && password==user.password){

        alert("Đăng nhập thành công!");

    }else{

        alert("Sai email hoặc mật khẩu!");

    }

}