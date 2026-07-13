def test_register_returns_token(client):
    res = client.post(
        "/auth/register",
        json={"email": "yeni@test.com", "password": "sifre1234"},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_register_duplicate_email_fails(client):
    client.post("/auth/register", json={"email": "ayni@test.com", "password": "sifre1234"})
    res = client.post("/auth/register", json={"email": "ayni@test.com", "password": "sifre1234"})
    assert res.status_code == 400


def test_login_success(client):
    client.post("/auth/register", json={"email": "giris@test.com", "password": "sifre1234"})
    res = client.post("/auth/login", json={"email": "giris@test.com", "password": "sifre1234"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password_fails(client):
    client.post("/auth/register", json={"email": "yanlis@test.com", "password": "sifre1234"})
    res = client.post("/auth/login", json={"email": "yanlis@test.com", "password": "hatali"})
    assert res.status_code == 401


def test_login_unknown_user_fails(client):
    res = client.post("/auth/login", json={"email": "yok@test.com", "password": "sifre1234"})
    assert res.status_code == 401
