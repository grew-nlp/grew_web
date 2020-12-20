Vue.config.devtools = true

var current = new Vue({
  el: '#app',
  data: {
    grew_back_url: "http://back.grew.fr/",

    session_id: "Not connected",
    grs: 'No GRS loaded',
    strats: [],

    corpus: 'No corpus loaded',
    sent_ids: [],

    level: 0,
    selected_graph: "",
    selected_strat: "",
    nb_rules: 0,

    normal_forms: [],

    enable_rules: false,
    rules: [],


    svg_init: "",
    svg_final: "",
    svg_before: "",
    svg_after: "",
  },
  methods: {}
})

// ====================================================================================================
$(document).ready(function() {
  init();
  connect();
});

// ====================================================================================================
function init() {
  if (window.location.origin.includes("localhost")) {
    current.grew_back_url = "http://localhost:8080/"
    $('.navbar').css({
      'background': 'orange'
    });
  }
}

// ====================================================================================================
function connect() {
  var form = new FormData();
  var settings = {
    "url": current.grew_back_url + "connect",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("connect", resp.message.message, "error");
      } else {
        current.session_id = resp.data;
      }
    })
    .fail(function() {
      swal("Connection fail", "The grew_back service is not available.", "error");
    });
}


// ====================================================================================================
function set_level(level) {
  current.level = level;

  if (level < 2) {
    $('#pill-corpus .nav-item').removeClass('selected');
    current.svg_init = "";
  }
  if (level < 4) {
    current.normal_forms = [];
    current.svg_final = "";
    current.selected_strat = "";
  }
  if (level < 5) {
    current.rules = [];
    current.svg_before = "";
    current.svg_after = "";
  }
}


// ====================================================================================================
$('#dep_graph').change(function() {
  var form = new FormData();
  form.append("session_id", current.session_id);
  if ($(this).prop('checked')) {
    form.append("display", "dep");
  } else {
    form.append("display", "graph");
  }

  var settings = {
    "url": current.grew_back_url + "set_display",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("set_display", resp.message, "error");
      } else {
        if ("init" in resp.data) {
          current.svg_init = resp.data.init;
        }
        if ("final" in resp.data) {
          current.svg_final = resp.data.final;
        }
        if ("before" in resp.data) {
          current.svg_before = resp.data.before;
        }
        if ("after" in resp.data) {
          current.svg_after = resp.data.after;
        }
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });
})

// ====================================================================================================
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  upload_corpus(files[0]);
  // next line: trick to deal with reloading of the same file
  $("#corpus_input").val('');
})

function upload_corpus(file) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("file", corpus_input.files[0], file);

  var settings = {
    "url": current.grew_back_url + "upload_corpus",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("upload_corpus", resp.message, "error");

      } else {
        set_level(1);
        current.corpus = file.name;
        current.sent_ids = resp.data.sent_ids;
        if (resp.data.sent_ids.length == 1) {
          select_graph(resp.data.sent_ids[0])
        }
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });

}

// ====================================================================================================
// Binding on grs_input
$("#grs_input").change(function(event) {
  const files = event.target.files;
  upload_grs(files[0]);
  // next line: trick to deal with reloading of the same file
  $("#grs_input").val('');
})

function upload_grs(file) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("file", grs_input.files[0], file);


  var settings = {
    "url": current.grew_back_url + "upload_grs",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("upload_grs", resp.message, "error");
      } else {
        current.grs = file.name;
        current.strats = resp.data;
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });

}

// ====================================================================================================
function select_graph_event(event) {
  const sent_id = event.target.id;
  select_graph(sent_id);
}

// ====================================================================================================
function select_graph(sent_id) {
  set_level(2);
  console.log("[select_graph] " + sent_id);

  $('#pill-corpus .nav-item').removeClass('selected');
  $("#" + sent_id).parent().addClass("selected");

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("sent_id", sent_id);

  var settings = {
    "url": current.grew_back_url + "select_graph",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("select_graph", resp.message, "error");
      } else {
        current.selected_graph = sent_id;
        current.svg_init = resp.data;
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });

}

// ====================================================================================================
function rewrite(event) {
  if (current.level >= 2) {
    set_level(3);
    const strat = event.target.id.slice(6) // remove the prefix "strat-"
    console.log("[rewrite] " + strat);

    var form = new FormData();
    form.append("session_id", current.session_id);
    form.append("strat", strat);

    var settings = {
      "url": current.grew_back_url + "rewrite",
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form
    };

    $.ajax(settings)
      .done(function(response) {
        console.log(response);
        resp = JSON.parse(response);
        if (resp.status === "ERROR") {
          swal("rewrite", resp.message, "error");
        } else {
          current.normal_forms = [];
          console.log(resp);
          if (resp.data == []) {
            swal("rewrite", "No graph produced", "info");
            set_level(2);
          } else {
            current.normal_forms = resp.data
            current.selected_strat = strat;
            $("#button-rewriting").click(); // change pane
          }
          // if there is exactly one normal_form, select it
          if (resp.data.length == 1) {
            select_normal_form(0);
          }
        }
      })
      .fail(function() {
        swal("Connection lost", "The grew_back service is not more available.", "error");
      });
  }
}

// ====================================================================================================
function select_normal_form_event(event) {
  const position = event.target.id.slice(2); // remove prefix "G_"
  select_normal_form(position);
}

// ====================================================================================================
function select_normal_form(position) {
  console.log("[select_normal_form] " + position);
  set_level(4);

  current.nb_rules = current.normal_forms[position];

  $('#pill-rewriting .nav-item').removeClass('selected');
  $("#" + event.target.id).parent().addClass("selected");

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("position", position);

  var settings = {
    "url": current.grew_back_url + "select_normal_form",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("select_normal_form", resp.message, "error");
      } else {
        current.svg_final = resp.data;
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });
}

// ====================================================================================================
function get_rules(event) {
  set_level(5);
  // current.enable_rules = true;
  var form = new FormData();
  form.append("session_id", current.session_id);

  var settings = {
    "url": current.grew_back_url + "rules",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("rules", resp.message, "error");
      } else {
        current.rules = resp.data;
        $("#button-rules").click();
        if (resp.data.length == 1) {
          select_rule(1);
        }
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });
}

// ====================================================================================================
function select_rule_event(event) {
  const position = event.target.id.split("-")[0];
  select_rule(position)
}

// ====================================================================================================
function select_rule(position) {
  set_level(6);
  console.log("[select_rule] " + position);

  $('#pill-rules .nav-item').removeClass('selected');
  // jquery selector does not work because of the dot usage in rule names (stackoverflow.com/questions/605630)
  $(document.getElementById(event.target.id)).parent().addClass("selected");

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("position", position);

  var settings = {
    "url": current.grew_back_url + "select_rule",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal("select_rule", resp.message, "error");
      } else {
        current.svg_before = resp.data.before;
        current.svg_after = resp.data.after;
      }
    })
    .fail(function() {
      swal("Connection lost", "The grew_back service is not more available.", "error");
    });

}

// ====================================================================================================
syncScroll($('#svg_init'), $('#svg_final'));
syncScroll($('#svg_before'), $('#svg_after'));


/***
 *   Synchronize Scroll
 *   Synchronizes the horizontal scrolling of two elements.
 *   The elements can have different content widths.
 *
 *   @param $el1 {Object}
 *       Native DOM element or jQuery selector.
 *       First element to sync.
 *   @param $el2 {Object}
 *       Native DOM element or jQuery selector.
 *       Second element to sync.
 *
 *  adapted from https://stackoverflow.com/questions/18952623/synchronized-scrolling-using-jquery#answer-27007581
 *
 */
function syncScroll(el1, el2) {
  var $el1 = $(el1);
  var $el2 = $(el2);

  // Lets us know when a scroll is organic
  // or forced from the synced element.
  var forcedScroll = false;

  // Catch our elements' scroll events and
  // syncronize the related element.
  $el1.scroll(function() {
    performScroll($el1, $el2);
  });
  $el2.scroll(function() {
    performScroll($el2, $el1);
  });

  // Perform the scroll of the synced element
  // based on the scrolled element.
  function performScroll($scrolled, $toScroll) {
    if (forcedScroll) return (forcedScroll = false);
    var percent = ($scrolled.scrollLeft() / ($scrolled[0].scrollWidth - $scrolled.outerWidth())) * 100;
    setScrollLeftFromPercent($toScroll, percent);
  }

  // Scroll to a position in the given
  // element based on a percent.
  function setScrollLeftFromPercent($el, percent) {
    var scrollLeftPos = (percent / 100) * ($el[0].scrollWidth - $el.outerWidth());
    forcedScroll = true;
    $el.scrollLeft(scrollLeftPos);
  }
}