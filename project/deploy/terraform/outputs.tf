output "cloud_ip" {
  value = hcloud_server.cloud.ipv4_address
}

output "cloud_ssh" {
  value = "ssh root@${hcloud_server.cloud.ipv4_address}"
}

output "volume_id" {
  value = hcloud_volume.data.id
}