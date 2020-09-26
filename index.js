

// update of the file selector content
$(".custom-file-input").on("change", function() {
  var fileName = $(this).val().split("\\").pop();
  $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});




var myObject = new Vue({
  el: '#app',
  data: {message: 'Hello Vue!'}
})





const uploadFile = file => {
  console.log("Uploading file...");
  const API_ENDPOINT = "http://localhost:8080/upload";
  const request = new XMLHttpRequest();
  const formData = new FormData();

  request.open("POST", API_ENDPOINT, true);
  request.onreadystatechange = () => {
    if (request.readyState === 4 && request.status === 200) {
      console.log(request.responseText);
      $("#reply").html (request.responseText);
       myObject.message = "John Doe";
    }
    else {
      $("#reply").html ("ERROR");
    }
  };
  formData.append("file", file);
  request.send(formData);
};

$("#fileInput").change (function (event)
{
  const files = event.target.files;
  uploadFile(files[0]);
})