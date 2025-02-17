Vue.config.devtools = true
searchParams = undefined

var current = new Vue({
  el: '#app',
  data: {
    grew_back_url: "https://gwd.grew.fr/",
    session_id: "Not connected",
    level: 0,

    processing: false,

    pane: 1,

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
    edited: false,

    corpus: 'No corpus loaded',
    meta: {},
    sent_ids: [],
    selected_sent_id: "",
    search: "",

    normal_forms: [],
    selected_normal_form: -1, // the index of the currently selected normal_form
    log_rewrite: {
      "rules": 0,
      "time": 0
    },
    rules: [],
    selected_rule: -1, // the index of the currently selected rule
    nb_rules: 0,


    svg_init: "",
    svg_final: "",
    svg_before: "",
    svg_after: "",

    warnings: [],
    skip_beforeunload: false,

    modal_text: "",
    modal_title: "JSON",
    modal_url: "",
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
      let param = {
        "session_id": current.session_id,
        "code": current.code_editor.getValue()
      }

      generic(current.grew_back_url, "upload_grs_code", param)
      .then(function (data) {
            current.grs = "Locally edited";
        current.grs_data = current.code_editor.getValue();
        update_strats(data);
        if (current.level > 2) {
          set_level(2)
        };
        current.pane = 1;
        current.edited = false;
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
          if (current.level > 3) {
            current.pane = 2;
          }
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
        current.pane = 3;
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
    },

    openModal(format) {
      get_normal_form(format);
      current.modal_title = format
      $('#modal_nf_code').modal('show');
    },
    closeModal() {
      $('#modal_nf_code').modal('hide');
    }
  }
})

function clear_filter() {
  current.search = "";
}

// ==================================================================================
async function generic(backend, service, data) {
  try {
    const response = await fetch(backend+service, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (result.status === "ERROR") {
      alert (JSON.stringify (result.message))
      return null
    } else {
      return (result.data)
    }
  } catch (error) {
    const msg = `Service \`${service}\` unavailable.\n\n${error.message}`
    alert (msg, "Network error")
  }
}

// ====================================================================================================
$(document).ready(function() {

  searchParams = new URLSearchParams(window.location.search)

  $('[data-toggle="tooltip"]').tooltip()

  console.log (current.grew_back_url)

  init();
  connect();

  window.addEventListener('beforeunload', function(e) {
    if (current.level > 0 && !current.skip_beforeunload) {
      // Cancel the event
      e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
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
      current.code_editor.on("change", function() {
        current.edited = true;
      });
      current.edited = false;
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
        swal(service, JSON.stringify(resp.message), "error");
      } else if (resp.status === "BUG") {
        swal(service, "BUG, please report\n" + JSON.stringify(resp.message), "error")
      } else {
        console.log("Success request to service: " + service + "-->" + resp.data);
        data_fct(resp.data);
      }
      enable_ui();
    })
    .fail(function() {
      // if (service != "connect") {
        swal("Connection fail", "The grew_back service `" + service + "` is not available.", "error");
        enable_ui();
      // } else {
      //   window.location.replace("./maintenance.html");
      // }
    });
}



// ==================================================================================
function _connect() {
  let param = {
  }

  generic(current.grew_back_url, "connect", param)
  .then(function (data) {
    current.session_id = data;
    // TODO: get code from OLD _connect
  })
}





// ====================================================================================================
function connect() {
  if (searchParams.has('session_id')) { // connection with session_id build by a previous service
    current.session_id = searchParams.get('session_id');
    if (searchParams.has('grs')) {
      url_grs(searchParams.get('grs'));
    }
    let param = {
      "session_id": current.session_id,
    }
    generic(current.grew_back_url, "get_grs", param)
    .then(function (data) {
        if (data != null) {
        update_strats(data);
      }
    })
    generic(current.grew_back_url, "get_corpus", param)
    .then(function (data) {
      current.corpus = "direct";
      current.meta = data.meta_list;
      current.warnings = data.warnings;
      current.sent_ids = Object.keys(data.meta_list); // rely on the ordering of object keys (may be fragile)
      set_level(1);
      current.pane = 1;
      if (current.sent_ids.length == 1) {
        select_graph(current.sent_ids[0]);
        set_level(2);
      }
    })
  } else { // new connection without session_id
    generic(current.grew_back_url, "connect", {})
    .then(function (data) {
      current.session_id = data;
      if (searchParams.has('grs')) {
        url_grs(searchParams.get('grs'));
      }
      if (searchParams.has('corpus')) {
        url_corpus(searchParams.get('corpus'));
      }
    })
  }
}

// ====================================================================================================
function set_level(level) {
  current.level = level;

  if (level < 2) {
    $('#pill-corpus .nav-item').removeClass('selected');
    current.svg_init = "";
    current.selected_sent_id = "";
  }
  if (level <= 2) {
    current.selected_strat = "";
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

  let param = {
    "session_id": current.session_id,
    "display": ($(this).prop('checked')) ? "dep" : "graph"
  }

  generic(current.grew_back_url, "set_display", param)
  .then(function (data) {
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
    current.meta = data.meta_list;
    current.warnings = data.warnings;
    current.sent_ids = Object.keys(data.meta_list); // rely on the ordering of object keys (may be fragile)
    set_level(1);
    current.pane = 1;
    if (current.sent_ids.length == 1) {
      select_graph(current.sent_ids[0]);
      set_level(2);
    }
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

  let param = {
    "session_id": current.session_id,
    "url": url
  }

  generic(current.grew_back_url, "url_grs", param)
  .then(function (data) {
    current.grs = "From URL";
    update_strats(data);
    update_code_editor(data.code);
    if (current.level > 2) {
      set_level(2)
    };
    current.pane = 1;
    current.editer = false;
  })
}

// ====================================================================================================
function url_corpus(url) {
 
  let param = {
    "session_id": current.session_id,
    "url": url
  }

  generic(current.grew_back_url, "url_corpus", param)
  .then(function (data) {
    current.corpus = "From URL";
    current.meta = data;
    current.sent_ids = Object.keys(data); // rely on the ordering of object keys (may be fragile)
    set_level(1);
    current.pane = 1;
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
      current.edited = false;
    };
    current.pane = 1;
    // read data for current.code_editor (see https://stackoverflow.com/questions/3582671)
    var reader = new FileReader();
    reader.onload = function(e) {
      update_code_editor(e.target.result);
      current.edited = false;
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
function _select_graph(sent_id) {
  console.log("[select_graph] >>>" + sent_id + "<<<");
  set_level(2);

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("sent_id", sent_id.trim());

  request("select_graph", form, function(data) {
    current.selected_sent_id = sent_id;
    current.svg_init = data;
  });
}

// ====================================================================================================
function select_graph(sent_id) {
  console.log("[select_graph] >>>" + sent_id + "<<<");
  set_level(2);

  let param = {
    "session_id": current.session_id,
    "sent_id": sent_id.trim()
  }
  generic(current.grew_back_url, "select_graph", param)
  .then(function (data) {
    current.selected_sent_id = sent_id;
    current.svg_init = data;
  })
}

// ====================================================================================================
function rewrite(strat) {
  console.log("[rewrite] " + strat);
  current.selected_strat = "";
  set_level(2); // ensure level 2 in case of error in the "rewrite" request

  let param = {
    "session_id": current.session_id,
    "strat": strat
  }

  generic(current.grew_back_url, "rewrite", param)
  .then(function (data) {
    current.selected_strat = strat;
    current.normal_forms = [];
    if (data.normal_forms.length == 0) {
      set_level(3);
    } else {
      set_level(4);
      current.normal_forms = data.normal_forms;
      current.log_rewrite = data.log;
      current.pane = 2;
      // if there is exactly one normal_form, select it
      if (data.normal_forms.length == 1) {
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

    let param = {
      "session_id": current.session_id,
      "position": Number(position)
    }
  
    generic(current.grew_back_url, "select_normal_form", param)
    .then(function (data) {
        current.svg_final = data;
    })
  }
}

// ====================================================================================================
// function

// ====================================================================================================
function get_rules() {
  set_level(7);

  let param = {
    "session_id": current.session_id
  }

  generic(current.grew_back_url, "rules", param)
  .then(function (data) {
  current.rules = data;
    current.pane = 3;
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

  let param = {
    "session_id": current.session_id,
    "position": Number(position)
  }

  generic(current.grew_back_url, "select_rule", param)
  .then(function (data) {
    current.svg_before = data.before;
    current.svg_after = data.after;
  })
}

// ====================================================================================================
$("#grs_folder_input").change(function(event) {
  let all_files = Object.values(event.target.files);

  // Do not take into account hidden files
  let files = all_files.filter(file => file["name"][0] != '.');

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
    let param = {
      "session_id": current.session_id,
      "grs_file": grs_file
    }

    generic(current.grew_back_url, "load_grs", param)
    .then(function (data) {
    update_strats(data);
      if (current.level > 2) {
        set_level(2)
      };
      current.pane = 1;
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
function get_normal_form(format) {

  let param = {
    "session_id": current.session_id,
    "format": format
  }

  generic(current.grew_back_url, "save_normal_form", param)
  .then(function (url) {
    fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(text => {
      current.modal_url = url;
      current.modal_text = text;
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  })
}

// ====================================================================================================
// see: https://stackoverflow.com/questions/38670610
function disable_ui() {
  current.processing = true;
  $("#loading_overlay").dialog({
    modal: true,
    closeOnEscape: false,
    dialogClass: "dialog-no-close",
  });
}

function enable_ui() {
  if (current.processing) {
    $("#loading_overlay").dialog("close");
    current.processing = false;
  }
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