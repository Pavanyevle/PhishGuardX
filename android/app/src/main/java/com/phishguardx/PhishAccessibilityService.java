package com.phishguardx;

import android.accessibilityservice.AccessibilityService;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.view.Gravity;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.LinearLayout;
import android.widget.TextView;

public class PhishAccessibilityService extends AccessibilityService {

    private ClipboardManager clipboardManager;
    private String lastCopied = "";
    private WindowManager windowManager;
    private LinearLayout overlayView;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();

        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        clipboardManager.addPrimaryClipChangedListener(() -> {

            if (clipboardManager.hasPrimaryClip()) {

                String copiedText = clipboardManager.getPrimaryClip()
                        .getItemAt(0)
                        .coerceToText(this)
                        .toString();

                if (copiedText.startsWith("http") && !copiedText.equals(lastCopied)) {
                    lastCopied = copiedText;

                    showOverlayWarning("⚠ Suspicious Link Detected");
                }
            }
        });
    }

    private void showOverlayWarning(String message) {

        if (overlayView != null) return;

        overlayView = new LinearLayout(this);
        overlayView.setBackgroundColor(Color.parseColor("#D32F2F"));
        overlayView.setPadding(40, 40, 40, 40);

        TextView textView = new TextView(this);
        textView.setText(message);
        textView.setTextColor(Color.WHITE);
        textView.setTextSize(18);

        overlayView.addView(textView);

        int layoutFlag = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY :
                WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP;

        windowManager.addView(overlayView, params);

        overlayView.postDelayed(() -> {
            if (overlayView != null) {
                windowManager.removeView(overlayView);
                overlayView = null;
            }
        }, 4000);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Not needed now
    }

    @Override
    public void onInterrupt() {}
}
