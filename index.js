

// // update of the file selector content
// $(".custom-file-input").on("change", function() {
//   var fileName = $(this).val().split("\\").pop();
//   $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
// });




var current = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    corpus: 'No corpus loaded',
    sent_ids: ['ABJ_GWA_08_David-Lifestory_MG__1', 'ABJ_GWA_08_David-Lifestory_MG__134']
  },

  methods: {
    greet: function (event) {
      // `this` inside methods points to the Vue instance
      alert('Hello ' + this.id + '!')
      // `event` is the native DOM event
      if (event) {
        alert(event.target.tagName)
      }
    },
    toto: function (event) {
      console.log("+++++++++++++++++++");
      console.log(event.target.id);
      console.log("+++++++++++++++++++");
    }

  }
})

// binding on sent_id items
$(".sent").on('click', function() {
  alert(this.id);
})



const uploadFile = file => {
  console.log("Uploading file...");
  const API_ENDPOINT = "http://localhost:8080/upload";
  const request = new XMLHttpRequest();
  const formData = new FormData();

  request.open("POST", API_ENDPOINT, true);
  request.onreadystatechange = () => {
    if (request.readyState === 4 && request.status === 200) {
      resp = JSON.parse (request.responseText);
      console.log(resp.data.sent_ids);
      $("#reply").html (request.responseText);
       current.message = "John Doe";
       current.sent_ids = resp.data.sent_ids;
       // add bindings
       $(".sent").on('click', function() {
         alert(this.id);
       })

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