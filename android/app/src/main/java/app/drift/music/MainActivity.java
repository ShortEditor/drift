package app.drift.music;

import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private float statusInset = 0;
    private void applyStatusInset() {
        if (bridge != null) bridge.getWebView().evaluateJavascript("document.documentElement.style.setProperty('--android-status-inset','" + statusInset + "px')", null);
    }
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DriftSharePlugin.class);
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(false);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        getWindow().setNavigationBarColor(Color.rgb(16,18,23));
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setBackgroundColor(Color.rgb(8,8,10));
            bridge.addWebViewListener(new WebViewListener() {
                @Override public void onPageLoaded(WebView webView) { applyStatusInset(); }
            });
            ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (view, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                view.setPadding(0, 0, 0, bars.bottom);
                statusInset = bars.top / getResources().getDisplayMetrics().density;
                applyStatusInset();
                return insets;
            });
            bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(true);
            bridge.getWebView().getSettings().setAllowFileAccess(false);
            bridge.getWebView().getSettings().setAllowContentAccess(false);
        }
    }
}
