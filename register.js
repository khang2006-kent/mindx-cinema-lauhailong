function register(){

    let username=document.getElementById("username").value;

    let email=document.getElementById("email").value;

    let password=document.getElementById("password").value;

    let user={

        username:username,

        email:email,

        password:password

    };

    localStorage.setItem("user",JSON.stringify(user));

    alert("Đăng ký thành công!");

    window.location="login.html";

}