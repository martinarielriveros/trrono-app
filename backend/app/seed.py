"""Database seed runner CLI: python -m app.seed."""

import sys
import uuid

from geoalchemy2.elements import WKTElement
from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import logger, setup_logging
from app.core.security import get_password_hash
from app.models.bathroom import Bathroom, BathroomExtra
from app.models.user import User

DEFAULT_HOURS = [
    {
        "day_of_week": 0,
        "day_name": "Lunes",
        "open_time": "08:00",
        "close_time": "20:00",
        "is_closed": False,
    },
    {
        "day_of_week": 1,
        "day_name": "Martes",
        "open_time": "08:00",
        "close_time": "20:00",
        "is_closed": False,
    },
    {
        "day_of_week": 2,
        "day_name": "Miércoles",
        "open_time": "08:00",
        "close_time": "20:00",
        "is_closed": False,
    },
    {
        "day_of_week": 3,
        "day_name": "Jueves",
        "open_time": "08:00",
        "close_time": "20:00",
        "is_closed": False,
    },
    {
        "day_of_week": 4,
        "day_name": "Viernes",
        "open_time": "08:00",
        "close_time": "22:00",
        "is_closed": False,
    },
    {
        "day_of_week": 5,
        "day_name": "Sábado",
        "open_time": "09:00",
        "close_time": "22:00",
        "is_closed": False,
    },
    {
        "day_of_week": 6,
        "day_name": "Domingo",
        "open_time": "10:00",
        "close_time": "19:00",
        "is_closed": False,
    },
]


def run_seed() -> None:
    """Execute initial database seed with admin, demo vendors and initial bathrooms."""
    setup_logging()
    logger.info("Iniciando proceso de seeding para Tronno...")

    db = SessionLocal()
    try:
        # Check connection
        db.execute(text("SELECT 1"))
        logger.info("Conexión con PostgreSQL exitosa.")

        # 1. Seed Admin
        admin = db.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL.lower())
        ).scalar_one_or_none()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email=settings.ADMIN_EMAIL.lower(),
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="Administrador Tronno",
                role="admin",
                is_active=True,
                vendor_status="approved",
            )
            db.add(admin)
            logger.info("Admin creado: %s", settings.ADMIN_EMAIL)

        # 2. Seed Demo Vendors
        vendor_caba = db.execute(
            select(User).where(User.email == "vendedor.santelmo@tronno.com.ar")
        ).scalar_one_or_none()
        if not vendor_caba:
            vendor_caba = User(
                id=str(uuid.uuid4()),
                email="vendedor.santelmo@tronno.com.ar",
                hashed_password=get_password_hash("Vendedor123!"),
                full_name="Café Histórico San Telmo",
                phone="+54 11 4307-5544",
                role="vendor",
                cbu_cvu="0000003100098765432100",
                bank_alias="CAFE.HISTORICO.TRONNO",
                is_active=True,
                vendor_status="approved",
            )
            db.add(vendor_caba)
            logger.info("Vendedor demo CABA creado: %s", vendor_caba.email)

        vendor_santafe = db.execute(
            select(User).where(User.email == "vendedor.santafe@tronno.com.ar")
        ).scalar_one_or_none()
        if not vendor_santafe:
            vendor_santafe = User(
                id=str(uuid.uuid4()),
                email="vendedor.santafe@tronno.com.ar",
                hashed_password=get_password_hash("VendedorSantaFe123!"),
                full_name="Café & Parador Costanera Santa Fe",
                phone="+54 342 455-8899",
                role="vendor",
                cbu_cvu="0000003100076543210987",
                bank_alias="PARADOR.SANTAFE.TRONNO",
                is_active=True,
                vendor_status="approved",
            )
            db.add(vendor_santafe)
            logger.info("Vendedor demo Santa Fe creado: %s", vendor_santafe.email)

        # 3. Seed Demo Regular User
        demo_user = db.execute(
            select(User).where(User.email == "usuario.demo@tronno.com.ar")
        ).scalar_one_or_none()
        if not demo_user:
            demo_user = User(
                id=str(uuid.uuid4()),
                email="usuario.demo@tronno.com.ar",
                hashed_password=get_password_hash("Usuario123!"),
                full_name="Usuario Demo",
                phone="+54 11 5555-1234",
                role="user",
                is_active=True,
            )
            db.add(demo_user)
            logger.info("Usuario demo creado: %s", demo_user.email)

        db.commit()

        # 3. Seed Sample Bathrooms (CABA and Santa Fe Capital)
        sample_bathrooms = [
            # --- Santa Fe Capital ---
            {
                "title": "Café Peatonal San Martín - Confort y Accesibilidad",
                "description": (
                    "Baño impecable en pleno centro comercial y peatonal de Santa Fe. "
                    "Limpieza permanente tras cada turno, espejo amplio y adaptado para movilidad reducida."
                ),
                "address": "San Martín 2340",
                "city": "Santa Fe",
                "province": "Santa Fe",
                "vendor_id": vendor_santafe.id,
                "latitude": -31.6515,
                "longitude": -60.7098,
                "price_base": 600.0,
                "amenities": [
                    "Papel higiénico & jabón",
                    "Accesible silla de ruedas",
                    "Espejo amplio",
                    "Secador de manos",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Toalla descartable premium", "price": 200.0},
                ],
            },
            {
                "title": "Parador Costanera Setúbal - Ducha y Vestuario Deportivo",
                "description": (
                    "Frente a la Laguna Setúbal y el histórico Puente Colgante de Santa Fe. "
                    "Ideal para corredores y deportistas: ducha con agua caliente y vestuario sanitizado."
                ),
                "address": "Av. 7 de Jefes 3680",
                "city": "Santa Fe",
                "province": "Santa Fe",
                "vendor_id": vendor_santafe.id,
                "latitude": -31.6305,
                "longitude": -60.6820,
                "price_base": 850.0,
                "amenities": [
                    "Ducha con agua caliente",
                    "Secador de manos",
                    "Enchufe disponible",
                    "Papel higiénico & jabón",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Ducha con agua caliente", "price": 1000.0},
                    {"name": "Kit jabón & shampoo", "price": 450.0},
                ],
            },
            {
                "title": "Espacio Bulevar & Candioti - Polo Gastronómico",
                "description": (
                    "En el corazón gastronómico de Candioti a metros de la Estación Belgrano. "
                    "Ambiente moderno, desinfección continua y máxima higiene."
                ),
                "address": "Bv. Gálvez 1450",
                "city": "Santa Fe",
                "province": "Santa Fe",
                "vendor_id": vendor_santafe.id,
                "latitude": -31.6380,
                "longitude": -60.6935,
                "price_base": 700.0,
                "amenities": [
                    "Papel higiénico & jabón",
                    "Espejo amplio",
                    "Secador de manos",
                    "Enchufe disponible",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Kit toallita higiénica & alcohol", "price": 300.0},
                ],
            },
            {
                "title": "Punto Terminal Manuel Belgrano & Puerto",
                "description": (
                    "Estratégico a pasos de la Terminal de Ómnibus y el Puerto de Santa Fe. "
                    "Rápido acceso, máxima seguridad y cabina desinfectada para viajeros."
                ),
                "address": "Belgrano 2910",
                "city": "Santa Fe",
                "province": "Santa Fe",
                "vendor_id": vendor_santafe.id,
                "latitude": -31.6442,
                "longitude": -60.7015,
                "price_base": 500.0,
                "amenities": [
                    "Papel higiénico & jabón",
                    "Secador de manos",
                    "Cambiador de bebés",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Toalla y alcohol en gel", "price": 200.0},
                ],
            },
            {
                "title": "Recoleta Santafesina - Familiar con Cambiador",
                "description": (
                    "Espacio pensado para familias y paseos urbanos cerca de Plaza Pueyrredón. "
                    "Cambiador acolchonado para bebés, dispenser sanitizante y calefacción."
                ),
                "address": "25 de Mayo 3320",
                "city": "Santa Fe",
                "province": "Santa Fe",
                "vendor_id": vendor_santafe.id,
                "latitude": -31.6392,
                "longitude": -60.7042,
                "price_base": 650.0,
                "amenities": [
                    "Cambiador de bebés",
                    "Papel higiénico & jabón",
                    "Accesible silla de ruedas",
                    "Espejo amplio",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Kit pañal descartable & toallitas húmedas", "price": 600.0},
                ],
            },
            # --- Buenos Aires (CABA) ---
            {
                "title": "Baño Café San Telmo - Higiénico y Seguro",
                "description": (
                    "Baño individual con limpieza permanente tras cada uso. "
                    "Ideal para turistas y transeúntes en San Telmo."
                ),
                "address": "Defensa 1050",
                "city": "San Telmo",
                "province": "CABA",
                "vendor_id": vendor_caba.id,
                "latitude": -34.6212,
                "longitude": -58.3732,
                "price_base": 650.0,
                "amenities": [
                    "Papel higiénico & jabón",
                    "Espejo amplio",
                    "Accesible silla de ruedas",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Toalla descartable premium", "price": 250.0},
                ],
            },
            {
                "title": "Espacio Palermo Soho - Ducha y Vestuario",
                "description": (
                    "Baño amplio con cabina de ducha con agua caliente y "
                    "vestuario impecable a pasos de Plaza Serrano."
                ),
                "address": "Honduras 4950",
                "city": "Palermo Soho",
                "province": "CABA",
                "vendor_id": vendor_caba.id,
                "latitude": -34.5884,
                "longitude": -58.4305,
                "price_base": 900.0,
                "amenities": [
                    "Ducha con agua caliente",
                    "Secador de manos",
                    "Enchufe disponible",
                    "Papel higiénico & jabón",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Ducha con agua caliente", "price": 1100.0},
                    {"name": "Kit de jabón & shampoo", "price": 500.0},
                ],
            },
            {
                "title": "Punto Obelisco / Microcentro",
                "description": (
                    "Ubicación estratégica en la peatonal Florida. "
                    "Rápido acceso, máxima limpieza y desinfección continua."
                ),
                "address": "Florida 450",
                "city": "Microcentro",
                "province": "CABA",
                "vendor_id": vendor_caba.id,
                "latitude": -34.6037,
                "longitude": -58.3776,
                "price_base": 500.0,
                "amenities": ["Papel higiénico & jabón", "Espejo amplio", "Secador de manos"],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [],
            },
            {
                "title": "Recoleta Village - Confort y Cambiador",
                "description": (
                    "Espacio premium con cambiador de bebés, música "
                    "funcional y limpieza hospitalaria."
                ),
                "address": "Junín 1750",
                "city": "Recoleta",
                "province": "CABA",
                "vendor_id": vendor_caba.id,
                "latitude": -34.5873,
                "longitude": -58.3916,
                "price_base": 750.0,
                "amenities": [
                    "Cambiador de bebés",
                    "Accesible silla de ruedas",
                    "Papel higiénico & jabón",
                    "Espejo amplio",
                ],
                "photos": [
                    {
                        "url": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800",
                        "is_cover": True,
                    }
                ],
                "extras": [
                    {"name": "Kit muda de bebé descartable", "price": 600.0},
                ],
            },
        ]

        for b_data in sample_bathrooms:
            existing_b = db.execute(
                select(Bathroom).where(Bathroom.title == b_data["title"])
            ).scalar_one_or_none()
            if not existing_b:
                b_id = str(uuid.uuid4())
                b = Bathroom(
                    id=b_id,
                    vendor_id=b_data["vendor_id"],
                    title=b_data["title"],
                    description=b_data["description"],
                    address=b_data["address"],
                    city=b_data["city"],
                    province=b_data["province"],
                    latitude=b_data["latitude"],
                    longitude=b_data["longitude"],
                    location=WKTElement(
                        f"POINT({b_data['longitude']} {b_data['latitude']})", srid=4326
                    ),
                    price_base=b_data["price_base"],
                    turn_duration_minutes=15,
                    cleaning_interval_minutes=5,
                    rules=[
                        "Prohibido fumar",
                        "No tirar papeles al inodoro",
                        "Cuidar las instalaciones",
                    ],
                    amenities=b_data["amenities"],
                    opening_hours=DEFAULT_HOURS,
                    photos=b_data["photos"],
                    is_active=True,
                    is_approved=True,
                )
                db.add(b)

                for ex_data in b_data.get("extras", []):
                    extra = BathroomExtra(
                        id=str(uuid.uuid4()),
                        bathroom_id=b_id,
                        name=ex_data["name"],
                        price=ex_data["price"],
                        is_active=True,
                    )
                    db.add(extra)

                logger.info("Baño sembrado: %s (%s, %s)", b.title, b.city, b.province)

        db.commit()
        logger.info("Seeding completo de Tronno ejecutado con éxito.")
    except Exception as exc:
        logger.error("Error durante el seeding: %s", exc)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
