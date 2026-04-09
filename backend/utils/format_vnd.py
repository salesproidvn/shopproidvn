def format_vnd(amount: int) -> str:
    """Format number as Vietnamese currency."""
    return f"{amount:,.0f}đ".replace(",", ".")
