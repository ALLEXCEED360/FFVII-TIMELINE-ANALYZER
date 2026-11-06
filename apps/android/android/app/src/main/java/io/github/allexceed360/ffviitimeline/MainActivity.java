package io.github.allexceed360.ffviitimeline;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Draw behind the status and navigation bars; the page keeps clear of them itself. After
        // Capacitor has set the app's theme, or the launch theme's title bar would stay.
        EdgeToEdge.enable(this);
    }
}
