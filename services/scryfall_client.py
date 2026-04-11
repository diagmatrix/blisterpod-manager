"""
Scryfall API client implementation.
"""

import time
import requests


class ScryfallError(Exception):
    """Base exception for Scryfall client failures."""


class ScryfallApiError(ScryfallError):
    """Structured Scryfall API error."""

    def __init__(self, status: int, code: str, details: str):
        self.status = status
        self.code = code
        self.details = details
        super().__init__(f"[{status}] {code}: {details}")


class ScryfallClient(requests.Session):
    """Minimal HTTP client for the Scryfall API."""

    BASE_URL = "https://api.scryfall.com"
    USER_AGENT = "blisterpod-manager/0.1"
    DEFAULT_TIMEOUT = 10.0
    WAIT_BETWEEN_REQUESTS = 0.1

    def __init__(self, timeout: float | None = None):
        """Initialize the Scryfall HTTP session.

        Args:
            timeout: Default timeout in seconds for outgoing requests.
        """
        super().__init__()
        self.headers.update({
            "Accept": "application/json",
            "User-Agent": self.USER_AGENT,
        })
        self._last_request_at = time.monotonic() - self.WAIT_BETWEEN_REQUESTS
        self._timeout = timeout if timeout is not None else self.DEFAULT_TIMEOUT

    def build_url(self, path: str) -> str:
        """
        Build a full URL for the given path.
        
        Arguments:
            path: The relative API path or full URL.

        Returns:
            The full URL.
        """

        if path.startswith("http://") or path.startswith("https://"):
            return path
        return f"{self.BASE_URL.rstrip('/')}/{path.lstrip('/')}"

    def request(self, method: str, url: str, **kwargs) -> requests.Response:
        """
        Override the base request method to add default timeout, rate limiting, and error handling.
        """

        kwargs.setdefault("timeout", self._timeout)
        true_url = self.build_url(url)

        wait_time = self.WAIT_BETWEEN_REQUESTS - (time.monotonic() - self._last_request_at)
        if wait_time > 0:
            time.sleep(wait_time)

        try:
            resp = super().request(method, true_url, **kwargs)
        finally:
            self._last_request_at = time.monotonic()

        if resp.ok:
            return resp

        self._raise_api_error(resp)
        return resp

    @staticmethod
    def _raise_api_error(resp: requests.Response) -> None:
        """Parse the error response from Scryfall and raise a structured ScryfallApiError."""
        try:
            payload = resp.json()
        except ValueError:
            return

        if not isinstance(payload, dict):
            return

        status = int(payload.get("status", resp.status_code))
        code = str(payload.get("code", "http_error"))
        details = str(payload.get("details", f"HTTP {resp.status_code}"))
        raise ScryfallApiError(status=status, code=code, details=details)

    def get(self, url: str, **kwargs) -> requests.Response:
        """Override the GET method to use the custom request method."""
        kwargs.setdefault("allow_redirects", True)
        return self.request("GET", url, **kwargs)
