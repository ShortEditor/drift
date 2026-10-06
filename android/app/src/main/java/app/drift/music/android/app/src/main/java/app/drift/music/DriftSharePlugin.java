package app.drift.music;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "DriftShare")
public class DriftSharePlugin extends Plugin {
    private byte[] png(PluginCall call) throws Exception {
        String encoded = call.getString("base64");
        if (encoded == null || encoded.length() > 16000000) throw new Exception("Invalid card");
        byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
        if (bytes.length < 8 || bytes[0] != (byte)137 || bytes[1] != 80 || bytes[2] != 78 || bytes[3] != 71) throw new Exception("PNG required");
        return bytes;
    }
    @PluginMethod public void share(PluginCall call) {
        try {
            byte[] bytes = png(call);
            File dir = new File(getContext().getCacheDir(), "drift-share");
            if (!dir.exists() && !dir.mkdirs()) throw new Exception("Cannot prepare card");
            // Retain at most eight old cards, no music or provider artwork is written.
            File[] old = dir.listFiles();
            if (old != null && old.length > 8) for (File f : old) if (System.currentTimeMillis()-f.lastModified()>3600000) f.delete();
            File file = File.createTempFile("drift-story-", ".png", dir);
            try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName()+".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND).setType("image/png");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
            send.setClipData(ClipData.newRawUri("Drift story", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(send, "Share Drift card"));
            call.resolve();
        } catch (Exception e) { call.reject("Could not open sharing"); }
    }
    @PluginMethod public void save(PluginCall call) {
        try {
            png(call);
            Intent create = new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("image/png");
            create.addCategory(Intent.CATEGORY_OPENABLE);
            create.putExtra(Intent.EXTRA_TITLE, "drift-story.png");
            startActivityForResult(call, create, "saved");
        } catch (Exception e) { call.reject("Could not open save picker"); }
    }
    @ActivityCallback private void saved(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            JSObject value = new JSObject(); value.put("canceled", true); call.resolve(value); return;
        }
        try (OutputStream out = getContext().getContentResolver().openOutputStream(result.getData().getData())) {
            if (out == null) throw new Exception("No destination");
            out.write(png(call));
            JSObject value = new JSObject(); value.put("canceled", false); call.resolve(value);
        } catch (Exception e) { call.reject("Card could not be saved"); }
    }
}
