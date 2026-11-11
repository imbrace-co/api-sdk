from __future__ import annotations
from typing import Literal, Optional
from dataclasses import dataclass, field

# The iMBrace environments a client can target: "cloud" (the production cloud, the default),
# "sandbox" and "develop". "stable" and "prodv2" are older names for "cloud": same gateway,
# kept so existing code keeps working. Use "cloud" in new code.
Environment = Literal["cloud", "sandbox", "develop", "stable", "prodv2"]


@dataclass
class ServiceHosts:
    ips: Optional[str] = None
    data_board: Optional[str] = None


@dataclass
class EnvironmentPreset:
    gateway: str
    service_hosts: ServiceHosts = field(default_factory=ServiceHosts)


_CLOUD_GATEWAY = "https://app-gatewayv2.imbrace.co"

ENVIRONMENTS: dict[str, EnvironmentPreset] = {
    "cloud": EnvironmentPreset(gateway=_CLOUD_GATEWAY),
    "sandbox": EnvironmentPreset(
        gateway="https://app-gateway.sandbox.imbrace.co",
    ),
    "develop": EnvironmentPreset(
        gateway="https://app-gateway.dev.imbrace.co",
    ),
    # Older names for "cloud".
    "stable": EnvironmentPreset(gateway=_CLOUD_GATEWAY),
    "prodv2": EnvironmentPreset(gateway=_CLOUD_GATEWAY),
}
