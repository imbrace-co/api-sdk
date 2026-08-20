from __future__ import annotations
from typing import Optional, Union, Dict
from dataclasses import dataclass

from .environments import EnvironmentPreset, ENVIRONMENTS


@dataclass
class ServiceUrls:
    gateway: str
    channel_service: str
    platform: str
    ips: str
    data_board: str
    backend: str
    ai: str
    marketplaces: str
    file_service: str
    message_suggestion: str
    predict: str
    workflow_engine: str
    ai_agent: str


def resolve_service_urls(
    env: Union[str, EnvironmentPreset],
    overrides: Optional[Dict[str, str]] = None,
) -> ServiceUrls:
    if isinstance(env, str):
        preset = ENVIRONMENTS[env]
    else:
        preset = env

    gw = preset.gateway.rstrip("/")

    resolved = ServiceUrls(
        gateway=gw,
        channel_service=f"{gw}/channel-service",
        platform=f"{gw}/platform",
        ips=f"{(preset.service_hosts.ips or gw).rstrip('/')}/ips/v1",
        data_board=f"{gw}/data-board",
        backend=f"{gw}/v1/backend",
        ai=gw,
        marketplaces=f"{gw}/marketplaces/v2",
        file_service=f"{gw}/files/v1",
        message_suggestion=f"{gw}/v1/message-suggestion",
        predict=f"{gw}/predict",
        workflow_engine=f"{gw}/activepieces",
        ai_agent=f"{gw}/ai-agent",
    )

    if overrides:
        for key, value in overrides.items():
            if hasattr(resolved, key) and value is not None:
                setattr(resolved, key, value)

    return resolved
