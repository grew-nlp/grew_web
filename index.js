
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
    }
    else {
      $("#reply").html ("ERROR");
    }
  };
  formData.append("file", file);
  formData.append("filename", "xxx");
  request.send(formData);
};

$("#fileInput").change (function (event)
{
  const files = event.target.files;
  console.log("tagada"+files.length);
  uploadFile(files[0]);
})