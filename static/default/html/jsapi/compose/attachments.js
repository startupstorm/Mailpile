/* Compose - Attachments */

Mailpile.Composer.Attachments.UploaderImagePreview = function(file, mid) {

  var item = $('<li class="compose-attachment"><a href="#" data-mid="XXX" data-aid="XXX" class="compose-attachment-remove"><span class="icon-circle-x"></span></a></li>').prependTo($('#compose-attachments-files-' + mid));
  var image = $(new Image()).appendTo(item);

  // Create an instance of the mOxie Image object. This
  // utility object provides several means of reading in
  // and loading image data from various sources.
  // Wiki: https://github.com/moxiecode/moxie/wiki/Image
  var preloader = new mOxie.Image();

  // Define the onload BEFORE you execute the load()
  // command as load() does not execute async.
  preloader.onload = function() {

      // This will scale the image (in memory) before it
      // tries to render it. This just reduces the amount
      // of Base64 data that needs to be rendered.
      preloader.downsize(100, 100);

      // Now that the image is preloaded, grab the Base64
      // encoded data URL. This will show the image
      // without making an Network request using the
      // client-side file binary.
      image.prop("src", preloader.getAsDataURL());
  };

  // Calling the .getSource() on the file will return an
  // instance of mOxie.File, which is a unified file
  // wrapper that can be used across the various runtime
  // Wiki: https://github.com/moxiecode/plupload/wiki/File
  preloader.load(file.getSource());
};


Mailpile.Composer.Attachments.Uploader = function(settings) {

  var uploader = new plupload.Uploader({
  	runtimes : 'html5',
  	browse_button : settings.browse_button, // you can pass in id...
  	container: settings.container, // ... or DOM Element itself
    drop_element: settings.container,
  	url : '/api/0/message/attach/',
    multipart : true,
    multipart_params : {'mid': settings.mid},
    file_data_name : 'file-data',
  	filters : {
  		max_file_size : '50mb',
  		mime_types: [
  			{title : "Audio files", extensions : "mp3,aac,flac,wav,ogg,aiff,midi"},
  			{title : "Document files", extensions : "pdf,doc,docx,xls,txt,rtf,ods"},
  			{title : "Image files", extensions : "jpg,jpeg,gif,png,svg,psd,tiff,bmp,ai,sketch"},
  			{title : "Image files", extensions : "mp2,mp4,mov,avi,mkv"},
  			{title : "Zip files", extensions : "zip,rar"},
  			{title : "Crypto files", extensions : "asc,pub,key"}
  		]
  	},
    resize: {
      width: '3600',
      height: '3600',
      crop: true,
      quaility: 100
    },
    views: {
      list: true,
      thumbs: true,
      active: 'thumbs'
    },
  	init: {
      PostInit: function() {
        $('#compose-attachments-' + settings.mid).find('.compose-attachment-pick').removeClass('hide');
        $('#compose-attachments-' + settings.mid).find('.attachment-browswer-unsupported').addClass('hide');
        uploader.refresh();
      },
      FilesAdded: function(up, files) {
        var start_upload = true;
  
        // Upload files
      	plupload.each(files, function(file) {
  
          // Show Warning for 50 mb or larger
          if (file.size > 52428800) {
            start_upload = false;
            alert(file.name + ' {{_("is")}} ' + plupload.formatSize(file.size) + '. {{_("Some people cannot receive attachments larger than 50 Megabytes.")}}');
          } else {
           // Show image preview
            if (_.indexOf(['image/jpg', 'image/jpeg', 'image/gif', 'image/png'], file.type) > -1) {
              Mailpile.Composer.Attachments.UploaderImagePreview(file, settings.mid);
            } else {
              var attachment_html = '<li class="compose-attachment" aid="' + file.id + '"> <div class="compose-attachment-filename">' + file.name + '</div> ' + plupload.formatSize(file.size) + '</li>';
          		$('#compose-attachments-files-' + settings.mid).append(attachment_html);
            }
          }
      	});
  
        if (start_upload) {
          uploader.start();
        }
      },
      UploadProgress: function(up, file) {
      	$('#' + file.id).find('b').html('<span>' + file.percent + '%</span>');
      },
      Error: function(up, err) {
        Mailpile.notification({status: 'error', message: "Oops, could not upload attachment because: " + err.message });
        $('#' + err.file.id).find('b').html('Failed ' + err.code);
        uploader.refresh();
      }
    }
  });

  return uploader.init();
};