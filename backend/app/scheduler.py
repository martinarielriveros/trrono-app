"""Background task scheduler using APScheduler."""

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.logging import logger

scheduler = BackgroundScheduler(timezone="UTC", daemon=True)


def sample_heartbeat_job() -> None:
    """Periodic job ensuring scheduler is healthy and logging heartbeats in dev."""
    logger.debug("Tronno scheduler heartbeat tick.")


def start_scheduler() -> None:
    """Start APScheduler jobs."""
    if not scheduler.running:
        scheduler.add_job(
            sample_heartbeat_job,
            "interval",
            minutes=10,
            id="scheduler_heartbeat",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("APScheduler started successfully.")


def shutdown_scheduler() -> None:
    """Gracefully shutdown scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
