Vue.config.devtools = true

var current = new Vue({
  el: '#app',
  data: {
    grew_back_url: "http://back.grew.fr/",
    session_id: "Not connected",
    level: 0,

    file_input: true, // true --> file    false --> folder

    grs: 'No GRS loaded',
    grs_data: "",
    grs_files: [], // used for folder loading
    selected_grs_file: "",

    nb_files: 0,
    count_upload: 0,

    strats: [],
    strat_kind: "",

    selected_strat: "",
    local_strat: "",
    code_editor: undefined,

    corpus: 'No corpus loaded',
    meta: {},
    sent_ids: [],
    selected_sent_id: "",
    search: "",

    normal_forms: [],
    selected_normal_form: -1, // the index of the currently selected normal_form

    rules: [],
    selected_rule: -1, // the index of the currently selected rule
    nb_rules: 0,


    svg_init: "",
    svg_final: "",
    svg_before: "",
    svg_after: "",
  },

  computed: {
    selected_meta: function() {
      return this.meta[this.selected_sent_id];
    },
    filtered_sent_ids: function() {
      var self = this;
      return this.sent_ids.filter(function(sent_id) {
        return sent_id.toLowerCase().indexOf(self.search.toLowerCase()) >= 0;
      });
    },
    // compute the number of lines in `grs_data`
    grs_length: function() {
      var length = 0;
      for (var i = 0; i < this.grs_data.length; ++i) {
        if (this.grs_data[i] == '\n') {
          length++;
        }
      }
      return length;
    }
  },

  methods: {
    // ------------------------------------------------------------
    upload_grs_from_editor() {
      var form = new FormData();
      form.append("session_id", current.session_id);
      form.append("code", current.code_editor.getValue());

      request("upload_grs_code", form, function(data) {
        current.grs = "Locally edited";
        update_strats(data);
        if (current.level > 2) {
          set_level(2)
        };
        $("#button-corpus").click(); // change pane
      })
    },

    // ------------------------------------------------------------
    rewrite_event(event) {
      const strat = event.target.id.slice(6) // remove the prefix "strat-"
      console.log("###strat=" + strat);
      if (strat == "__local__") {
        rewrite(current.local_strat);
      } else {
        if (strat != current.selected_strat) {
          rewrite(strat);
        } else {
          $("#button-rewriting").click(); // change pane
        }
      }
    },

    // ------------------------------------------------------------
    select_graph_event(event) {
      const sent_id = event.target.id;
      if (sent_id != current.selected_sent_id) {
        select_graph(sent_id);
      }
    },

    // ------------------------------------------------------------
    select_normal_form_event(event) {
      const position = event.target.id.slice(2); // remove prefix "G_"
      if (position != current.selected_normal_form) {
        select_normal_form(position);
      }
    },

    // ------------------------------------------------------------
    get_rules_event(event) {
      if (current.level > 6) {
        $("#button-rules").click();
      } else {
        get_rules()
      }
    },

    // ------------------------------------------------------------
    select_rule_event(event) {
      const position = event.target.id.slice(2); // remove prefix "R_"
      if (position != current.selected_rule) {
        select_rule(position);
      }
    },

    // ------------------------------------------------------------
    select_grs_file() {
      const grs_file = event.target.id.slice(9) // remove the prefix "grs_file-"
      if (grs_file != current.selected_grs_file) {
        load_grs(grs_file);
      }
    }

  }
})

function clear_filter() {
  current.search = "";
}

// ====================================================================================================
$(document).ready(function() {
  init();
  connect();

  $(window).on('beforeunload', function() {
    if (current.level == 0) {
      return true;
    } else {
      var c = confirm();
      if (c) {
        return true;
      } else
        return false;
    }
  });

  $("#view_code").click(function() {
    // if `code_modal` already shown -> nothing to do
    if (!$('#code_modal').hasClass('show')) {

      $('#code_modal').modal({
        backdrop: false,
        show: true,
      });

      // Initialise CodeMirror when the textarea is visible and only once
      if (current.code_editor === undefined) {
        current.code_editor = CodeMirror.fromTextArea(document.getElementById("grs_display"), {
          lineNumbers: true,
          // readOnly: true,
          theme: "neat",
        });
      }
      current.code_editor.setValue(current.grs_data);
    }
  });

  $('#code_modal-content').resizable({
    alsoResize: "#code_modal-dialog",
    minHeight: 300,
    minWidth: 300
  });

  $('#code_modal-dialog').draggable({
    handle: "#code_modal-header"
  });

});

// ====================================================================================================
function modal_resize() {
  if (current.code_editor !== undefined) {
    // ugly hack to make editor follow the size on the modal
    // NB: the height of modal-body in correcly updated when increasing but not when decreading!
    // TODO?: replace 170 by a value computed at the beginning
    $('#grs_display + div').height($('#code_modal-content').height() - 170);
    current.code_editor.refresh();
  }
}

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
function request(service, form, data_fct) {
  console.log("Send request to service: " + service);
  var settings = {
    "url": current.grew_back_url + service,
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal(service, resp.message, "error");
      } else {
        console.log("Success request to service: " + service + "-->" + resp.data);
        data_fct(resp.data);
      }
    })
    .fail(function() {
      if (service != "connect") {
        swal("Connection fail", "The grew_back service `" + service + "` is not available.", "error");
      } else {
        window.location.replace("./maintenance.html");
      }
    });
}

// ====================================================================================================
function connect() {
  var form = new FormData();
  request("connect", form, function(data) {
    current.session_id = data;
    parameters(); // make sure that parameters are handled after connection with the server
  })
}

// ====================================================================================================
function parameters() {
  let searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('grs')) {
    url_grs(searchParams.get('grs'));
  }
  if (searchParams.has('corpus')) {
    url_corpus(searchParams.get('corpus'));
  }
}

// ====================================================================================================
function set_level(level) {
  current.level = level;

  if (level < 2) {
    $('#pill-corpus .nav-item').removeClass('selected');
    current.svg_init = "";
  }
  if (level <= 2) {
    current.selected_strat = "";
    current.selected_sent_id = "";
  }
  if (level < 5) {
    current.selected_normal_form = -1;
    current.normal_forms = [];
    current.svg_final = "";
  }
  if (level < 7) {
    current.rules = [];
    current.svg_before = "";
    current.svg_after = "";
    current.selected_rule = -1;
  }
}


// ====================================================================================================
$('#file_folder').change(function() {
  current.file_input = $(this).prop('checked');
})


// ====================================================================================================
$('#dep_graph').change(function() {
  var form = new FormData();
  form.append("session_id", current.session_id);
  if ($(this).prop('checked')) {
    form.append("display", "dep");
  } else {
    form.append("display", "graph");
  }

  request("set_display", form, function(data) {
    if ("init" in data) {
      current.svg_init = data.init;
      if (current.level == 5) { // special case "No rules applied" --> update final
        current.svg_final = data.init;
      }
    }
    if ("final" in data) {
      current.svg_final = data.final;
    }
    if ("before" in data) {
      current.svg_before = data.before;
    }
    if ("after" in data) {
      current.svg_after = data.after;
    }
  })
})

// ====================================================================================================
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  upload_corpus(files[0]);
  // next line: trick to deal with reloading of the same file
  $("#corpus_input").val('');
})

// ====================================================================================================
function upload_corpus(file) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("file", file);

  disable_ui();
  request("upload_corpus", form, function(data) {
    current.corpus = file.name;
    current.meta = data;
    current.sent_ids = Object.keys(data); // rely on the ordering of object keys (may be fragile)
    set_level(1);
    $("#button-corpus").click(); // change pane
    if (current.sent_ids.length == 1) {
      select_graph(current.sent_ids[0]);
      set_level(2);
    }
    enable_ui();
  })
}

// ====================================================================================================
function update_strats(data) {
  if (data.strategies !== undefined) {
    current.strats = data.strategies;
    current.strat_kind = "Strategies";
  } else if (data.packages !== undefined) {
    current.strats = data.packages;
    current.strat_kind = "Packages";
  } else if (data.rules !== undefined) {
    current.strats = data.rules;
    current.strat_kind = "Rules";
  } else {
    current.strats = [];
    current.strat_kind = "__No strat defined__";
  }
}

// ====================================================================================================
function url_grs(url) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("url", url);

  request("url_grs", form, function(data) {
    current.grs = "From URL";
    update_strats(data);
    update_code_editor(data.code);
    if (current.level > 2) {
      set_level(2)
    };
    $("#button-corpus").click(); // change pane
  })
}

// ====================================================================================================
function url_corpus(url) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("url", url);

  request("url_corpus", form, function(data) {
    current.corpus = "From URL";
    current.meta = data;
    current.sent_ids = Object.keys(data); // rely on the ordering of object keys (may be fragile)
    set_level(1);
    $("#button-corpus").click(); // change pane
    if (current.sent_ids.length == 1) {
      select_graph(current.sent_ids[0]);
      set_level(2);
    }
  })
}

// ====================================================================================================
// Binding on grs_file_input
$("#grs_file_input").change(function(event) {
  const files = event.target.files;
  upload_grs(files[0]);
  // next line: trick to deal with reloading of the same file
  $("#grs_file_input").val('');
})

// ====================================================================================================
function upload_grs(file) {

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("file", file);

  request("upload_grs", form, function(data) {
    current.grs_files = [];
    current.grs = "File: " + file.name;
    update_strats(data);
    if (current.level > 2) {
      set_level(2)
    };
    $("#button-corpus").click(); // change pane

    // read data for current.code_editor (see https://stackoverflow.com/questions/3582671)
    var reader = new FileReader();
    reader.onload = function(e) {
      update_code_editor(e.target.result)
    };
    reader.readAsText(file);
  })
}

// ====================================================================================================
function update_code_editor(code) {
  // When the modal is not shown, the update is ineffective -> store value in `grs_data` and `code_editor` will be updated when modal becomes visible
  current.grs_data = code;
  if (current.code_editor !== undefined) {
    current.code_editor.setValue(code);
  }
}

// ====================================================================================================
function select_graph(sent_id) {
  console.log("[select_graph] " + sent_id);
  set_level(2);

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("sent_id", sent_id);

  request("select_graph", form, function(data) {
    current.selected_sent_id = sent_id;
    current.svg_init = data;
  });
}

// ====================================================================================================
function rewrite(strat) {
  console.log("[rewrite] " + strat);
  set_level(4);

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("strat", strat);

  request("rewrite", form, function(data) {
    current.selected_strat = strat;
    current.normal_forms = [];
    if (data.length == 0) {
      set_level(3);
    } else {
      current.normal_forms = data
      $("#button-rewriting").click(); // change pane
      // if there is exactly one normal_form, select it
      if (data.length == 1) {
        select_normal_form(0);
      }
    }
  })
}

// ====================================================================================================
function select_normal_form(position) {
  console.log("[select_normal_form] " + position);
  current.selected_normal_form = position;

  current.nb_rules = current.normal_forms[position];

  if (current.nb_rules == 0) {
    set_level(5);
    current.svg_final = current.svg_init;
  } else {
    set_level(6);

    var form = new FormData();
    form.append("session_id", current.session_id);
    form.append("position", position);

    request("select_normal_form", form, function(data) {
      current.svg_final = data;
    })
  }
}

// ====================================================================================================
// function

// ====================================================================================================
function get_rules() {
  set_level(7);
  var form = new FormData();
  form.append("session_id", current.session_id);

  request("rules", form, function(data) {
    current.rules = data;
    $("#button-rules").click();
    if (data.length == 1) {
      select_rule(0);
    }
  })
}

// ====================================================================================================
//function

// ====================================================================================================
function select_rule(position) {
  console.log("[select_rule] " + position);
  set_level(8);
  current.selected_rule = position;

  if (current.code_editor !== undefined) {
    var rule = current.rules[position];
    current.code_editor.scrollIntoView({
      line: current.grs_length
    });
    current.code_editor.scrollIntoView({
      line: rule[1] - 1
    });
  }

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("position", position);

  request("select_rule", form, function(data) {
    current.svg_before = data.before;
    current.svg_after = data.after;
  })
}

// ====================================================================================================
$("#grs_folder_input").change(function(event) {
  let all_files = Object.values(event.target.files);

  // Do not take into account hidden files
  let files = all_files.filter ( file => file["name"][0] != '.');

  if (files.length > 100) {
    swal("Cannot upload", "Too much files (more than 100)", "error");
  } else {
    current.nb_files = files.length;
    current.grs_files = [];
    current.count_upload = 0;
    for (let i = 0; i < files.length; i++) {
      upload_file(files[i]);
      let filename = files[i].webkitRelativePath;
      if (filename.split('.').pop() == "grs") {
        let slash_pos = filename.indexOf('/');
        current.grs_files.push(filename.slice(slash_pos + 1));
      }
      if (current.grs_files.length == 1) {
        // only one grs file --> select it be default
        load_grs(current.grs_files[0])
      }
    };
    let slash_pos = files[0].webkitRelativePath.indexOf('/');
    current.grs = "Folder: " + files[0].webkitRelativePath.slice(0, slash_pos);
  }
  $("#grs_folder_input").val('');
})

// ====================================================================================================
function load_grs(grs_file) {
  // we have to wait until all files are uploaded
  if (current.count_upload == current.nb_files) {
    var form = new FormData();
    form.append("session_id", current.session_id);
    form.append("grs_file", grs_file);

    request("load_grs", form, function(data) {
      update_strats(data);
      if (current.level > 2) {
        set_level(2)
      };
      $("#button-corpus").click(); // change pane
      current.selected_grs_file = grs_file;
    })
  } else {
    // run again the function after some delay if all files are not uploaded
    setTimeout(() => {
      load_grs(grs_file);
    }, 200);
  }
}

// ====================================================================================================
function upload_file(file) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("path", file.webkitRelativePath);
  form.append("file", file);

  request("upload_file", form, function(data) {
    console.log("Uploaded ==> " + file.webkitRelativePath);
    current.count_upload += 1;
  })
}

// ====================================================================================================
// see: https://stackoverflow.com/questions/38670610
function disable_ui() {
  $("#loading_overlay").dialog({
    modal: true,
    closeOnEscape: false,
    dialogClass: "dialog-no-close",
  });
}
function enable_ui() {
  $("#loading_overlay").dialog("close");
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