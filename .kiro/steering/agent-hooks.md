# Agent Hooks Guidelines

## Overview

Agent hooks automate code quality and validation processes throughout development. These hooks trigger automated checks when specific events occur, such as file modifications.

## TypeScript Validator Hook

**Trigger**: File save events for .ts and .tsx files

**Actions**:
- Run TypeScript compiler in check mode
- Run ESLint with TypeScript rules
- Report errors directly in the IDE

**Implementation**:
- Watch file system events
- Execute validation in background process
- Parse and format error output
- Display results in IDE

## API Integration Validator

**Trigger**: Modification of API-related files

**Actions**:
- Check for breaking changes in API interfaces
- Validate against OpenAPI specifications
- Ensure backward compatibility

**Implementation**:
- Parse API definitions
- Compare with previous versions
- Apply compatibility rules
- Generate compatibility report

## Curriculum Data Validator

**Trigger**: Modification of curriculum data files

**Actions**:
- Validate curriculum data against schema
- Check for required educational metadata
- Verify curriculum standard references

**Implementation**:
- Parse curriculum data
- Apply schema validation
- Verify educational metadata
- Check standard reference integrity

## Emotional Design Review

**Trigger**: Modification of UI components

**Actions**:
- Review for emotional design principles
- Check accessibility compliance
- Verify animation guidelines

**Implementation**:
- Analyze component structure
- Apply emotional design heuristics
- Check accessibility attributes
- Verify animation properties

## Test Update Hook

**Trigger**: Modification of implementation files

**Actions**:
- Update or suggest updates to corresponding test files
- Check test coverage
- Verify test quality

**Implementation**:
- Identify related test files
- Analyze implementation changes
- Generate test update suggestions
- Check coverage impact

## Curriculum Alignment Check

**Trigger**: Modification of learning content

**Actions**:
- Verify alignment with curriculum standards
- Check for educational gaps
- Validate content quality

**Implementation**:
- Parse content metadata
- Check standard alignments
- Identify potential gaps
- Verify educational quality metrics

## Hook Development Guidelines

- Hooks should be non-blocking to development workflow
- Provide clear, actionable error messages
- Include suggested fixes when possible
- Allow for manual override when necessary
- Maintain performance with efficient processing
- Log all validation activities for audit purposes