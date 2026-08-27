"""The sync and async resources must expose the same public API.

Python is the only SDK with this split — TypeScript has one class per resource
and every method is async. Whenever a method is added here it has to land on
both classes, and this test is what catches the ones that don't.
"""
import importlib
import pkgutil

import pytest

import imbrace.resources as resources_pkg


def _public(cls):
    return {n for n in dir(cls) if not n.startswith("_")}


def _resource_pairs():
    """Yield (name, sync_cls, async_cls) for every paired resource class."""
    pairs = []
    for mod_info in pkgutil.iter_modules(resources_pkg.__path__):
        mod = importlib.import_module(f"imbrace.resources.{mod_info.name}")
        for attr in dir(mod):
            if not attr.startswith("Async"):
                continue
            sync_cls = getattr(mod, attr[len("Async"):], None)
            if sync_cls is None:
                continue
            pairs.append((attr[len("Async"):], sync_cls, getattr(mod, attr)))
    return sorted(pairs, key=lambda p: p[0])


PAIRS = _resource_pairs()


def test_every_resource_has_an_async_twin():
    assert PAIRS, "no paired resources discovered — the pairing rule changed"


@pytest.mark.parametrize("name,sync_cls,async_cls", PAIRS, ids=[p[0] for p in PAIRS])
def test_sync_and_async_expose_the_same_methods(name, sync_cls, async_cls):
    sync_only = _public(sync_cls) - _public(async_cls)
    async_only = _public(async_cls) - _public(sync_cls)
    assert not sync_only, f"{name}: missing on the async class: {sorted(sync_only)}"
    assert not async_only, f"{name}: missing on the sync class: {sorted(async_only)}"
