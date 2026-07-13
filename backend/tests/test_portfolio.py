def test_portfolio_requires_auth(client):
    res = client.get("/portfolio/")
    assert res.status_code in (401, 403)


def test_add_and_list_holding(client, auth_headers):
    res = client.post(
        "/portfolio/",
        json={
            "asset_symbol": "BTC",
            "asset_type": "kripto",
            "quantity": 0.5,
            "purchase_price": 60000,
        },
        headers=auth_headers,
    )
    assert res.status_code == 200
    holding = res.json()
    assert holding["asset_symbol"] == "BTC"
    assert holding["is_active"] is True

    res = client.get("/portfolio/", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_delete_holding_is_soft_delete(client, auth_headers):
    res = client.post(
        "/portfolio/",
        json={
            "asset_symbol": "ETH",
            "asset_type": "kripto",
            "quantity": 1,
            "purchase_price": 2000,
        },
        headers=auth_headers,
    )
    holding_id = res.json()["id"]

    res = client.delete(f"/portfolio/{holding_id}", headers=auth_headers)
    assert res.status_code == 200

    res = client.get("/portfolio/", headers=auth_headers)
    assert res.json() == []

    res = client.get("/portfolio/history", headers=auth_headers)
    history = res.json()
    assert len(history) == 1
    assert history[0]["is_active"] is False
    assert history[0]["removed_at"] is not None


def test_delete_nonexistent_holding_returns_404(client, auth_headers):
    res = client.delete("/portfolio/999", headers=auth_headers)
    assert res.status_code == 404


def test_cannot_see_other_users_holdings(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "sifre1234"})
    token_a = client.post(
        "/auth/login", json={"email": "a@test.com", "password": "sifre1234"}
    ).json()["access_token"]
    client.post(
        "/portfolio/",
        json={"asset_symbol": "BTC", "asset_type": "kripto", "quantity": 1, "purchase_price": 1000},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    client.post("/auth/register", json={"email": "b@test.com", "password": "sifre1234"})
    token_b = client.post(
        "/auth/login", json={"email": "b@test.com", "password": "sifre1234"}
    ).json()["access_token"]

    res = client.get("/portfolio/", headers={"Authorization": f"Bearer {token_b}"})
    assert res.json() == []
