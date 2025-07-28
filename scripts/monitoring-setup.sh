#!/bin/bash

echo "📊 PageFlow Monitoring Setup"
echo "============================"

# Create monitoring directories
echo "📁 Creating monitoring directories..."
mkdir -p logs
mkdir -p metrics
mkdir -p health-checks

# Create log rotation configuration
echo "📝 Creating log rotation configuration..."
cat > logs/logrotate.conf << EOF
# PageFlow Log Rotation Configuration
logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload pageflow-services
    endscript
}
EOF

# Create health check endpoints
echo "🏥 Creating health check endpoints..."
cat > health-checks/health-check.sh << EOF
#!/bin/bash

# Health check for all PageFlow services
SERVICES=(
    "http://localhost:3000/health"  # API Gateway
    "http://localhost:3001/health"  # User Service
    "http://localhost:3002/health"  # Progress Service
    "http://localhost:3003/health"  # Assessment Service
    "http://localhost:3004/health"  # Bedrock Service
    "http://localhost:3005/health"  # Device Sync Service
    "http://localhost:3006/health"  # Learning Path Service
    "http://localhost:3007/health"  # Page Companion Service
)

for service in "\${SERVICES[@]}"; do
    response=\$(curl -s -o /dev/null -w "%{http_code}" \$service)
    if [ \$response -eq 200 ]; then
        echo "✅ \$service - Healthy"
    else
        echo "❌ \$service - Unhealthy (HTTP \$response)"
    fi
done
EOF

chmod +x health-checks/health-check.sh

# Create metrics collection script
echo "📈 Creating metrics collection script..."
cat > metrics/collect-metrics.sh << EOF
#!/bin/bash

# Collect system and application metrics
echo "=== PageFlow Metrics Report ==="
echo "Timestamp: \$(date)"
echo ""

# System metrics
echo "System Metrics:"
echo "CPU Usage: \$(top -l 1 | grep "CPU usage" | awk '{print \$3}')"
echo "Memory Usage: \$(top -l 1 | grep "PhysMem" | awk '{print \$2}')"
echo "Disk Usage: \$(df -h / | tail -1 | awk '{print \$5}')"
echo ""

# Application metrics
echo "Application Metrics:"
echo "Active Docker containers: \$(docker ps --format "table {{.Names}}\t{{.Status}}" | wc -l)"
echo "Total Docker containers: \$(docker ps -a --format "table {{.Names}}\t{{.Status}}" | wc -l)"
echo ""

# Network metrics
echo "Network Metrics:"
echo "Active connections: \$(netstat -an | grep ESTABLISHED | wc -l)"
echo "Listening ports: \$(netstat -an | grep LISTEN | wc -l)"
EOF

chmod +x metrics/collect-metrics.sh

# Create alerting configuration
echo "🚨 Creating alerting configuration..."
cat > monitoring/alerts.conf << EOF
# PageFlow Alerting Configuration

# Service health alerts
alert service_down {
    condition: health_check_failed
    threshold: 1
    duration: 5m
    action: send_notification
}

# Performance alerts
alert high_cpu {
    condition: cpu_usage > 80
    threshold: 3
    duration: 10m
    action: scale_up
}

alert high_memory {
    condition: memory_usage > 85
    threshold: 2
    duration: 5m
    action: restart_service
}

# Error rate alerts
alert high_error_rate {
    condition: error_rate > 5
    threshold: 1
    duration: 2m
    action: investigate
}
EOF

echo "✅ Monitoring setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure log shipping to centralized logging system"
echo "2. Set up metrics dashboard (Grafana/Prometheus)"
echo "3. Configure alerting channels (Slack/Email)"
echo "4. Set up automated health checks"
echo "5. Configure performance monitoring" 