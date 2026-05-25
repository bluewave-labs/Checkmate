# Infrastructure Monitoring - Disk Selection

This guide explains how to use the selective disk monitoring feature in Checkmate's infrastructure monitoring.

## Overview

By default, Checkmate monitors all detected disks on your server. The disk selection feature allows you to choose specific disks/mountpoints to monitor, giving you more control over what gets tracked and displayed.

## Prerequisites

- Checkmate server running with [Capture agent](https://github.com/bluewave-labs/capture) installed on target server
- An existing infrastructure monitor already created and configured
- At least one disk detected by the Capture agent

## Using Disk Selection

### Accessing the Feature

1. Navigate to your Infrastructure monitors page
2. Click on an existing infrastructure monitor to view details
3. Click the "Configure" or "Edit" button
4. Scroll down to the **Disk Selection** section

> **Note:** The disk selection feature is only available when editing existing monitors that have already detected disks.

### Selecting Disks to Monitor

1. **View Available Disks**: The system automatically detects all disks/mountpoints from your server
2. **Select Disks**: Check the boxes next to the disks you want to monitor
3. **Apply Changes**: Click "Save" to update your monitor configuration

### Understanding Disk Identifiers

Disks are identified by their mountpoint or device name:
- **Mountpoint**: `/` (root), `/home`, `/var`, etc.
- **Device**: `/dev/sda1`, `/dev/nvme0n1p1`, etc.

### Behavior

- **All disks selected**: Shows all detected disks in gauges and charts
- **Specific disks selected**: Only shows selected disks in the monitoring interface
- **No disks detected**: Displays "No disk detected for the moment" message

## What Gets Filtered

When you select specific disks, the following elements are filtered:

- **Disk Usage Gauges**: Only selected disks appear in the dashboard
- **Disk Usage Charts**: Time-series charts show only selected disks
- **Monitor Table**: Summary view reflects only selected disk usage

## Example Use Cases

- **Server with multiple drives**: Monitor only critical system disks, ignore temporary storage
- **Database servers**: Focus monitoring on database partition while ignoring logs partition
- **Web servers**: Monitor web content disk separately from system disk
- **Development environments**: Track only project-specific mountpoints

## Troubleshooting

### No Disks Appearing
- Verify the Capture agent is running on the target server
- Check that the agent has proper permissions to read disk information
- Ensure the monitor has been running long enough to collect at least one check

### Missing Disk Information
- Some disks may not be accessible to the Capture agent due to permissions
- Virtual or network-mounted disks may not appear in the list
- Check the Capture agent logs for any disk detection errors

## Related Documentation

- [Infrastructure Monitoring Setup](https://checkmate.so/docs)
- [Capture Agent Installation](https://github.com/bluewave-labs/capture)