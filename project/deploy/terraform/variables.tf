variable "environment" {
  type        = string
  description = "staging | production"
  default     = "staging"
}

variable "hcloud_token" {
  type        = string
  description = "Hetzner Cloud API token"
  sensitive   = true
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_ed25519.pub"
}

variable "server_type" {
  type    = string
  default = "cx22"
}

variable "location" {
  type    = string
  default = "fsn1"
}

variable "volume_size_gb" {
  type    = number
  default = 50
}