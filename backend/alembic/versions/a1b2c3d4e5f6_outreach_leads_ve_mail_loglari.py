"""outreach: leads ve outreach_emails tablolari eklendi

Revision ID: a1b2c3d4e5f6
Revises: e1e0edf4f0b0
Create Date: 2026-07-24 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e1e0edf4f0b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('linkedin_url', sa.String(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('source', sa.String(), server_default='apollo', nullable=False),
        sa.Column('email_status', sa.String(), nullable=True),
        sa.Column('status', sa.String(), server_default='pending', nullable=False),
        sa.Column('send_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('contacted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_leads_id'), 'leads', ['id'], unique=False)
    op.create_index(op.f('ix_leads_email'), 'leads', ['email'], unique=True)
    op.create_index(op.f('ix_leads_status'), 'leads', ['status'], unique=False)

    op.create_table(
        'outreach_emails',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('campaign', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_outreach_emails_id'), 'outreach_emails', ['id'], unique=False)
    op.create_index(op.f('ix_outreach_emails_lead_id'), 'outreach_emails', ['lead_id'], unique=False)
    op.create_index(op.f('ix_outreach_emails_campaign'), 'outreach_emails', ['campaign'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_outreach_emails_campaign'), table_name='outreach_emails')
    op.drop_index(op.f('ix_outreach_emails_lead_id'), table_name='outreach_emails')
    op.drop_index(op.f('ix_outreach_emails_id'), table_name='outreach_emails')
    op.drop_table('outreach_emails')
    op.drop_index(op.f('ix_leads_status'), table_name='leads')
    op.drop_index(op.f('ix_leads_email'), table_name='leads')
    op.drop_index(op.f('ix_leads_id'), table_name='leads')
    op.drop_table('leads')
